export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

const DEFAULT_THEME: Theme = 'dark'

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value)
}

/**
 * 選択中のテーマ。認証状態によらず全ページで同じ値を使いたいため、サインアウト
 * で消えるセッションではなく、独立したクッキーに保存する。
 *
 * `refresh: true` は値を変えていない再訪問でも `Set-Cookie` を送り直すための
 * 指定で、`app.vue` が毎回の訪問時に明示的に書き戻す処理と組み合わせて使う
 * （`useCookie` は既定では値が変わらない限りクッキーを書き直さない）。
 */
export function useTheme() {
  return useCookie<Theme>('theme', {
    default: () => DEFAULT_THEME,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
    refresh: true,
    decode: (value) => (isTheme(value) ? value : DEFAULT_THEME),
  })
}
