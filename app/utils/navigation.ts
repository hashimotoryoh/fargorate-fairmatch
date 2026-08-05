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
   * `@nuxt/icon` の `<Icon name>` にそのまま渡すアイコン名
   * （`heroicons:` または `mdi:` プレフィックス）。
   */
  icon: string
}

/**
 * 認証済みユーザー向けの主要ナビゲーション。
 * ヘッダーのタブとスマホのFAB（スピードダイヤル）で同じ項目を出すため、
 * 定義を一箇所に集める。
 */
export const mainNavItems: NavItem[] = [
  {
    to: '/dashboard',
    labelKey: 'nav.dashboard',
    icon: 'heroicons:squares-2x2',
  },
  { to: '/games', labelKey: 'nav.games', icon: 'mdi:billiards-rack' },
  { to: '/settings', labelKey: 'nav.settings', icon: 'heroicons:cog' },
]

/**
 * フッターのブランドエリアに出す、認証の要らない機能への導線。
 * プレイヤー検索はヘッダー右のアイコンボタンとここだけが経路なので、
 * 外すと辿り着けなくなる。
 *
 * `guestOnly` は未認証のユーザーだけに出す印。リンクとゲストの入口には
 * `guest` ミドルウェアが付いており、認証済みが開いても `/dashboard` へ
 * 戻されるだけのデッドリンクになるため、認証済みには見せない。
 */
export const footerStartNavItems: (Pick<NavItem, 'to' | 'labelKey'> & {
  guestOnly?: boolean
})[] = [
  { to: '/link', labelKey: 'nav.link', guestOnly: true },
  { to: '/guest', labelKey: 'nav.guest', guestOnly: true },
  { to: '/lookup', labelKey: 'nav.lookup' },
]

/**
 * フッターのSupport欄に出すページ内の導線。バグ報告や `/llms.txt` のような
 * 外部・生成物へのリンクは `localePath()` に通せないため `AppFooter` に直接置く。
 */
export const footerSupportNavItems: Pick<NavItem, 'to' | 'labelKey'>[] = [
  { to: '/faq', labelKey: 'document.faq' },
  { to: '/blog', labelKey: 'document.blog' },
]

/**
 * フッターのLegal欄に出すページ内の導線。本文は `content/` のMarkdownにある。
 * ライセンスはリポジトリ上のファイルへの外部リンクなので `AppFooter` に直接置く。
 */
export const footerLegalNavItems: Pick<NavItem, 'to' | 'labelKey'>[] = [
  { to: '/terms-conditions', labelKey: 'document.termsConditions' },
  { to: '/privacy-policy', labelKey: 'document.privacyPolicy' },
]

/** 認証後の既定の遷移先。 */
const DEFAULT_AFTER_AUTH = '/dashboard'

/**
 * `redirect` クエリの値を、遷移して良いパスに正規化する。
 *
 * この値はURLから誰でも与えられるため、そのまま `navigateTo` に渡すと
 * 外部サイトへ誘導するオープンリダイレクトになる。自サイト内の絶対パスだけを
 * 許可し、それ以外は既定の遷移先へ倒す。
 */
export function resolveRedirectPath(
  value: unknown,
  fallback: string = DEFAULT_AFTER_AUTH,
): string {
  if (typeof value !== 'string' || !value.startsWith('/')) {
    return fallback
  }

  // `//example.com` や `/\example.com` はプロトコル相対URLとして解釈されうる。
  if (value.startsWith('//') || value.startsWith('/\\')) {
    return fallback
  }

  return value
}
