const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'
// Googleが目安として示す既定値。0.0（Bot寄り）〜1.0（人間寄り）。
const RECAPTCHA_SCORE_THRESHOLD = 0.5

type RecaptchaVerifyResponse = {
  success: boolean
  score?: number
  action?: string
}

/**
 * reCAPTCHA v3 のトークンをGoogleのAPIで検証する。
 *
 * `action` はクライアント側で `execute()` に渡した値と一致するかを見て、
 * 他の画面向けに取得したトークンの使い回しを防ぐ。ただしこの検証は本番でのみ
 * 行う。Googleが公開しているテスト用キー（`.env.example` 参照）は
 * hostname・actionの検証を常にスキップする特殊なキーで、ローカル開発でも
 * 引き続きこのキーを使えるようにするため。
 */
export async function verifyRecaptchaToken(
  token: unknown,
  action: string,
): Promise<void> {
  if (typeof token !== 'string' || !token) {
    throw createError({
      statusCode: 422,
      statusMessage: 'recaptchaToken is required',
    })
  }

  const { recaptchaSecretKey } = useRuntimeConfig()

  // 未設定のまま気づかず本番稼働すると、全リクエストが422（ユーザー起因の
  // ように見える表示）で落ち続けてしまう。設定漏れとして明示的に検知する。
  if (!recaptchaSecretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'NUXT_RECAPTCHA_SECRET_KEY is not configured',
    })
  }

  let result: RecaptchaVerifyResponse
  try {
    result = await $fetch<RecaptchaVerifyResponse>(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      body: new URLSearchParams({
        secret: recaptchaSecretKey,
        response: token,
      }),
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the reCAPTCHA verification API',
    })
  }

  const shouldCheckAction = process.env.NODE_ENV === 'production'

  if (
    !result.success ||
    (shouldCheckAction && result.action !== action) ||
    (result.score ?? 0) < RECAPTCHA_SCORE_THRESHOLD
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: 'reCAPTCHA verification failed',
    })
  }
}
