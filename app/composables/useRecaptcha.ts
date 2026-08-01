declare global {
  interface Window {
    grecaptcha?: {
      ready(callback: () => void): void
      execute(siteKey: string, options: { action: string }): Promise<string>
    }
  }
}

const RECAPTCHA_SCRIPT_URL = 'https://www.google.com/recaptcha/api.js'

/**
 * reCAPTCHA v3 のスクリプトを遅延読み込みし、トークンの取得を提供する。
 *
 * `/lookup` からの総当たりを防ぐため、ID送信の直前に呼び出す想定。
 * スコアはサーバー側（`verifyRecaptchaToken`）で判定する。
 */
export function useRecaptcha() {
  const {
    public: { recaptchaSiteKey },
  } = useRuntimeConfig()

  let ready: Promise<void> | null = null

  function load(): Promise<void> {
    if (!ready) {
      // 失敗時は `ready` を戻し、次回呼び出しで読み込みを再試行できるようにする。
      ready = new Promise<void>((resolve, reject) => {
        if (window.grecaptcha) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = `${RECAPTCHA_SCRIPT_URL}?render=${encodeURIComponent(recaptchaSiteKey)}`
        script.onload = () => {
          if (!window.grecaptcha) {
            reject(
              new Error('reCAPTCHA script loaded without defining grecaptcha'),
            )
            return
          }
          window.grecaptcha.ready(() => resolve())
        }
        script.onerror = () =>
          reject(new Error('failed to load the reCAPTCHA script'))
        document.head.appendChild(script)
      }).catch((error: unknown) => {
        ready = null
        throw error
      })
    }

    return ready
  }

  async function execute(action: string): Promise<string> {
    await load()
    return window.grecaptcha!.execute(recaptchaSiteKey, { action })
  }

  return { execute }
}
