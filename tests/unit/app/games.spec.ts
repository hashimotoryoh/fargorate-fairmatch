import { describe, expect, it } from 'vitest'
import { gameDefinitions } from '../../../app/utils/games'

describe('gameDefinitions', () => {
  it('スラッグが重複しない', () => {
    const slugs = gameDefinitions.map((game) => game.slug)

    expect(new Set(slugs).size).toBe(slugs.length)
  })

  // ゲームが確定した後の画面は /games/<スラッグ>/ に置く規則。
  it('ブリーフィングのパスがスラッグと対応している', () => {
    for (const game of gameDefinitions) {
      expect(game.briefingPath).toBe(`/games/${game.slug}/briefing`)
    }
  })

  it('すべての項目が表示名のキーとMaterial Design Iconsのアイコン名を持つ', () => {
    for (const game of gameDefinitions) {
      expect(game.labelKey).not.toBe('')
      expect(game.descriptionKey).not.toBe('')
      expect(game.icon.startsWith('mdi:')).toBe(true)
    }
  })

  it('フェアセットマッチだけが利用可能になっている', () => {
    const available = gameDefinitions.filter((game) => game.available)

    expect(available.map((game) => game.slug)).toEqual(['fair-single-race'])
  })
})
