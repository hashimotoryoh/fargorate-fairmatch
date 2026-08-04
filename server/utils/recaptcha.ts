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
 * 他の画面向けに取得したトークンの使い回しを防ぐ。
 *
 * `score` と `action` はv3の応答にのみ含まれる。Googleが公開している
 * テストキーはv2用であり、これを設定すると応答に `score` が無いまま
 * `success: true` が返るため、ここのスコア判定で必ず落ちる。v3のテスト用
 * キーは公開されていないため、開発環境（`NODE_ENV=development`）では
 * 検証ごと省き、キーなしで動くようにしてある。reCAPTCHAそのものの動作を
 * 確かめる場合は、`localhost` をドメインに加えた自分のv3キーを設定し、
 * 本番ビルドで起動すること（`.env.example` 参照）。
 */
export async function verifyRecaptchaToken(
  token: unknown,
  action: string,
): Promise<void> {
  // クライアント側（`useRecaptcha`）も同じ条件でトークンの取得を省くため、
  // トークンの有無の検査より前に抜ける必要がある。
  if (process.env.NODE_ENV === 'development') {
    return
  }

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

  if (
    !result.success ||
    result.action !== action ||
    (result.score ?? 0) < RECAPTCHA_SCORE_THRESHOLD
  ) {
    throw createError({
      statusCode: 422,
      statusMessage: 'reCAPTCHA verification failed',
    })
  }
}
