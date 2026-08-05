import { describe, expect, it } from 'vitest'
import {
  footerLegalNavItems,
  footerStartNavItems,
  footerSupportNavItems,
  mainNavItems,
  resolveRedirectPath,
} from '../../../app/utils/navigation'

describe('mainNavItems', () => {
  it('ダッシュボード・ゲーム・設定の3項目を持つ', () => {
    expect(mainNavItems.map((item) => item.to)).toEqual([
      '/dashboard',
      '/games',
      '/settings',
    ])
  })

  // プレイヤー検索はヘッダー右のボタンとフッターから辿らせる方針。
  // 主要ナビゲーションに増やさない。
  it('プレイヤー検索を含めない', () => {
    expect(mainNavItems.map((item) => item.to)).not.toContain('/lookup')
  })

  it('すべての項目が自サイト内の絶対パスと表示名のキーとアイコン名を持つ', () => {
    for (const item of mainNavItems) {
      expect(item.to.startsWith('/')).toBe(true)
      expect(item.to.startsWith('//')).toBe(false)
      expect(item.labelKey).not.toBe('')
      expect(item.icon).toMatch(/^(heroicons|mdi):/)
    }
  })

  it('遷移先が重複しない', () => {
    const paths = mainNavItems.map((item) => item.to)

    expect(new Set(paths).size).toBe(paths.length)
  })

  // ビリヤードのラックはHeroiconsに無いため、ゲームだけMDIを使う。
  it('ゲームタブは mdi:billiards-rack を使う', () => {
    const games = mainNavItems.find((item) => item.to === '/games')

    expect(games?.icon).toBe('mdi:billiards-rack')
  })
})

describe('フッターの導線', () => {
  /**
   * 認証の要らない機能はブランドエリアに置く。とくにプレイヤー検索は
   * ヘッダー右のボタンとここだけが経路で、外れると辿り着けなくなる。
   */
  it('ブランドエリアにリンク・ゲスト・プレイヤー検索を並べる', () => {
    expect(footerStartNavItems.map((item) => item.to)).toEqual([
      '/link',
      '/guest',
      '/lookup',
    ])
  })

  /**
   * リンクとゲストの入口は認証済みには `guest` ミドルウェアで弾かれる
   * デッドリンクになるため、未認証だけに出す印を付ける。プレイヤー検索は
   * 認証の有無によらず機能するため印を付けない。
   */
  it('利用開始の導線だけに未認証専用の印を付ける', () => {
    const guestOnlyPaths = footerStartNavItems
      .filter((item) => item.guestOnly)
      .map((item) => item.to)

    expect(guestOnlyPaths).toEqual(['/link', '/guest'])
  })

  it('Support欄によくある質問とブログを並べる', () => {
    expect(footerSupportNavItems.map((item) => item.to)).toEqual([
      '/faq',
      '/blog',
    ])
  })

  it('Legal欄に利用規約とプライバシーポリシーを並べる', () => {
    expect(footerLegalNavItems.map((item) => item.to)).toEqual([
      '/terms-conditions',
      '/privacy-policy',
    ])
  })

  it('遷移先が欄をまたいでも重複しない', () => {
    const paths = [
      ...footerStartNavItems,
      ...footerSupportNavItems,
      ...footerLegalNavItems,
    ].map((item) => item.to)

    expect(new Set(paths).size).toBe(paths.length)
  })
})

describe('resolveRedirectPath', () => {
  it('自サイト内の絶対パスはそのまま返す', () => {
    expect(resolveRedirectPath('/games')).toBe('/games')
    expect(resolveRedirectPath('/settings?tab=account')).toBe(
      '/settings?tab=account',
    )
    expect(resolveRedirectPath('/dashboard#top')).toBe('/dashboard#top')
    expect(resolveRedirectPath('/')).toBe('/')
  })

  it('絶対URLを既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('https://example.com')).toBe('/dashboard')
    expect(resolveRedirectPath('http://example.com/games')).toBe('/dashboard')
    expect(resolveRedirectPath('javascript:alert(1)')).toBe('/dashboard')
  })

  // `//example.com` や `/\example.com` はブラウザがプロトコル相対URLとして
  // 解釈するため、`/` 始まりでも外部への誘導になりうる。
  it('プロトコル相対URLとして解釈されうる値を既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('//example.com')).toBe('/dashboard')
    expect(resolveRedirectPath('//example.com/games')).toBe('/dashboard')
    expect(resolveRedirectPath('/\\example.com')).toBe('/dashboard')
  })

  it('相対パスを既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('games')).toBe('/dashboard')
    expect(resolveRedirectPath('../games')).toBe('/dashboard')
    expect(resolveRedirectPath('')).toBe('/dashboard')
  })

  // ゲームの戻り先のように、既定の遷移先が文脈で変わる呼び出しがある。
  it('フォールバックを指定できる', () => {
    expect(resolveRedirectPath(undefined, '/games')).toBe('/games')
    expect(resolveRedirectPath('https://example.com', '/games')).toBe('/games')
    expect(resolveRedirectPath('/games/briefing', '/games')).toBe(
      '/games/briefing',
    )
  })

  // `redirect` クエリは同じキーを複数与えると配列になるなど、文字列とは限らない。
  it('文字列でない値を既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath(undefined)).toBe('/dashboard')
    expect(resolveRedirectPath(null)).toBe('/dashboard')
    expect(resolveRedirectPath(['/games', '/settings'])).toBe('/dashboard')
    expect(resolveRedirectPath(123)).toBe('/dashboard')
    expect(resolveRedirectPath({ path: '/games' })).toBe('/dashboard')
  })
})
