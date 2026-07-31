import { describe, expect, it } from 'vitest'
import {
  mainNavItems,
  resolveRedirectPath,
} from '../../../app/utils/navigation'

describe('mainNavItems', () => {
  it('ダッシュボード・ゲーム・設定の3項目を持つ', () => {
    expect(mainNavItems.map((item) => item.to)).toEqual([
      '/dashboard',
      '/game',
      '/settings',
    ])
  })

  it('すべての項目が自サイト内の絶対パスと表示名とアイコンを持つ', () => {
    for (const item of mainNavItems) {
      expect(item.to.startsWith('/')).toBe(true)
      expect(item.to.startsWith('//')).toBe(false)
      expect(item.label).not.toBe('')
      expect(item.iconPaths.length).toBeGreaterThan(0)
    }
  })

  it('遷移先が重複しない', () => {
    const paths = mainNavItems.map((item) => item.to)

    expect(new Set(paths).size).toBe(paths.length)
  })

  // ヘッダーとドックはこの配列を `key` に使うため、重複すると描画が壊れる。
  it('アイコンのパスが項目内で重複しない', () => {
    for (const item of mainNavItems) {
      expect(new Set(item.iconPaths).size).toBe(item.iconPaths.length)
    }
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

  // `redirect` クエリは同じキーを複数与えると配列になるなど、文字列とは限らない。
  it('文字列でない値を既定の遷移先へ倒す', () => {
    expect(resolveRedirectPath(undefined)).toBe('/dashboard')
    expect(resolveRedirectPath(null)).toBe('/dashboard')
    expect(resolveRedirectPath(['/game', '/settings'])).toBe('/dashboard')
    expect(resolveRedirectPath(123)).toBe('/dashboard')
    expect(resolveRedirectPath({ path: '/game' })).toBe('/dashboard')
  })
})
