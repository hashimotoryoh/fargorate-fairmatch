import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gameDefinitions } from '../../../app/utils/games'

const PUBLIC_DIR = fileURLToPath(new URL('../../../public', import.meta.url))

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

  it('すべての項目が表示名のキーとシンボルを持つ', () => {
    for (const game of gameDefinitions) {
      expect(game.labelKey).not.toBe('')
      expect(game.descriptionKey).not.toBe('')
      expect(Boolean(game.image) || Boolean(game.icon)).toBe(true)
    }
  })

  // 画像のパスを打ち間違えても画面上は枠が空くだけで壊れて見えないため、
  // 実在することをここで確かめる。
  it('シンボル画像が public に実在する', () => {
    for (const game of gameDefinitions) {
      if (!game.image) continue
      for (const path of [game.image.ja, game.image.en]) {
        expect(existsSync(join(PUBLIC_DIR, path)), path).toBe(true)
      }
    }
  })

  it('フェアセットマッチだけが利用可能になっている', () => {
    const available = gameDefinitions.filter((game) => game.available)

    expect(available.map((game) => game.slug)).toEqual(['fair-single-race'])
  })
})
