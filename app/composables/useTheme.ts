export const THEMES = ['dark', 'light'] as const

export type Theme = (typeof THEMES)[number]

const DEFAULT_THEME: Theme = 'dark'

function isTheme(value: string): value is Theme {
  return (THEMES as readonly string[]).includes(value)
}

/**
 * 選択中のテーマ。認証状態によらず全ページで同じ値を使いたいため、サインアウト
 * で消えるセッションではなく、独立したクッキーに保存する。
 */
export function useTheme() {
  return useCookie<Theme>('theme', {
    default: () => DEFAULT_THEME,
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    decode: (value) => (isTheme(value) ? value : DEFAULT_THEME),
  })
}
