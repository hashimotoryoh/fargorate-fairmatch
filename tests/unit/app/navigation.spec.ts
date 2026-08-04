import { describe, expect, it } from 'vitest'
import {
  documentNavItems,
  footerNavItems,
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

  // プレイヤー検索はフッターからだけ辿らせる方針。ドックに増やさない。
  it('プレイヤー検索を含めない', () => {
    expect(mainNavItems.map((item) => item.to)).not.toContain('/lookup')
  })

  it('すべての項目が自サイト内の絶対パスと表示名のキーとMaterial Design Iconsのアイコン名を持つ', () => {
    for (const item of mainNavItems) {
      expect(item.to.startsWith('/')).toBe(true)
      expect(item.to.startsWith('//')).toBe(false)
      expect(item.labelKey).not.toBe('')
      expect(item.icon.startsWith('mdi:')).toBe(true)
    }
  })

  it('遷移先が重複しない', () => {
    const paths = mainNavItems.map((item) => item.to)

    expect(new Set(paths).size).toBe(paths.length)
  })

  it('ゲームタブは mdi:billiards-rack を使う', () => {
    const games = mainNavItems.find((item) => item.to === '/games')

    expect(games?.icon).toBe('mdi:billiards-rack')
  })
})

describe('footerNavItems', () => {
  /**
   * プレイヤー検索はヘッダーにもドックにも置かないため、フッターが唯一の
   * 経路になる。ここから外れると辿り着けなくなる。
   */
  it('プレイヤー検索とドキュメントへの導線を並べる', () => {
    expect(footerNavItems.map((item) => item.to)).toEqual([
      '/lookup',
      ...documentNavItems.map((item) => item.to),
    ])
  })

  it('遷移先が重複しない', () => {
    const paths = footerNavItems.map((item) => item.to)

    expect(new Set(paths).size).toBe(paths.length)
  })
})

describe('resolveRedirectPath', () => {
  it('自サイト内の絶対パスはそのまま返す', () => {
    expect(resolveRedirectPath('/game')).toBe('/game')
    expect(resolveRedirectPath('/settings?tab=account')).toBe(
      '/settings?tab=account',
    )
    expect(resolveRedirectPath('/dashboard#top')).toBe('/dashboard#top')
    expect(resolveRedirectPath('/')).toBe('/')
  })

  it('絶対URLを既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('https://example.com')).toBe('/dashboard')
    expect(resolveRedirectPath('http://example.com/game')).toBe('/dashboard')
    expect(resolveRedirectPath('javascript:alert(1)')).toBe('/dashboard')
  })

  // `//example.com` や `/\example.com` はブラウザがプロトコル相対URLとして
  // 解釈するため、`/` 始まりでも外部への誘導になりうる。
  it('プロトコル相対URLとして解釈されうる値を既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('//example.com')).toBe('/dashboard')
    expect(resolveRedirectPath('//example.com/game')).toBe('/dashboard')
    expect(resolveRedirectPath('/\\example.com')).toBe('/dashboard')
  })

  it('相対パスを既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath('game')).toBe('/dashboard')
    expect(resolveRedirectPath('../game')).toBe('/dashboard')
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
    expect(resolveRedirectPath(['/game', '/settings'])).toBe('/dashboard')
    expect(resolveRedirectPath(123)).toBe('/dashboard')
    expect(resolveRedirectPath({ path: '/game' })).toBe('/dashboard')
  })
})
