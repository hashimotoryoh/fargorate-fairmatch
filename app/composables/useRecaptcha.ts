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
    ready ??= new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = `${RECAPTCHA_SCRIPT_URL}?render=${recaptchaSiteKey}`
      script.onload = () => window.grecaptcha!.ready(() => resolve())
      script.onerror = () =>
        reject(new Error('failed to load the reCAPTCHA script'))
      document.head.appendChild(script)
    })

    return ready
  }

  async function execute(action: string): Promise<string> {
    await load()
    return window.grecaptcha!.execute(recaptchaSiteKey, { action })
  }

  return { execute }
}
