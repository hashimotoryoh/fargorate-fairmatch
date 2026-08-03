export type NavItem = {
  /**
   * ロケールの接頭辞を含まないパス。描画側で `localePath()` に通すこと。
   * ここで変換すると、モジュールの読み込み時点のロケールに固定されてしまう。
   */
  to: string
  /**
   * 表示名のメッセージキー。モジュールスコープの定数では翻訳関数を呼べない
   * ため、文字列そのものではなくキーで持ち、描画側で `$t()` に通す。
   */
  labelKey: string
  /**
   * `@nuxt/icon` の `<Icon name>` にそのまま渡す、Material Design Icons
   * （`mdi:` プレフィックス）のアイコン名。
   */
  icon: string
}

/**
 * 認証済みユーザー向けの主要ナビゲーション。
 * ヘッダーのリンクとスマホのドックで同じ項目を出すため、定義を一箇所に集める。
 */
export const mainNavItems: NavItem[] = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: 'mdi:view-dashboard' },
  { to: '/game', labelKey: 'nav.game', icon: 'mdi:billiards-rack' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'mdi:cog' },
]

/**
 * フッターに出すドキュメントへの導線。認証の有無によらずどのページからも
 * 辿れる。本文は `content/` のMarkdownにある。
 */
export const documentNavItems: Pick<NavItem, 'to' | 'labelKey'>[] = [
  { to: '/blog', labelKey: 'document.blog' },
  { to: '/faq', labelKey: 'document.faq' },
  { to: '/privacy-policy', labelKey: 'document.privacyPolicy' },
  { to: '/terms-conditions', labelKey: 'document.termsConditions' },
]

/** 認証後の既定の遷移先。 */
const DEFAULT_AFTER_SIGN_IN = '/dashboard'

/**
 * `redirect` クエリの値を、遷移して良いパスに正規化する。
 *
 * この値はURLから誰でも与えられるため、そのまま `navigateTo` に渡すと
 * 外部サイトへ誘導するオープンリダイレクトになる。自サイト内の絶対パスだけを
 * 許可し、それ以外は既定の遷移先へ倒す。
 */
export function resolveRedirectPath(value: unknown): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return DEFAULT_AFTER_SIGN_IN
  }

  // `//example.com` や `/\example.com` はプロトコル相対URLとして解釈されうる。
  if (value.startsWith('//') || value.startsWith('/\\')) {
    return DEFAULT_AFTER_SIGN_IN
  }

  return value
}
