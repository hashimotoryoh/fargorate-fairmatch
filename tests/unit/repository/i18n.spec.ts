import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const LOCALES_DIR = fileURLToPath(
  new URL('../../../i18n/locales', import.meta.url),
)

const localeCodes = readdirSync(LOCALES_DIR)
  .filter((file) => file.endsWith('.json'))
  .map((file) => basename(file, '.json'))

function messages(code: string): unknown {
  return JSON.parse(readFileSync(join(LOCALES_DIR, `${code}.json`), 'utf8'))
}

/** ネストしたメッセージを `index.features.record.title` の形に平らにする。 */
function flatten(value: unknown, prefix = ''): Map<string, string> {
  const entries = new Map<string, string>()

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key

    if (typeof child === 'string') {
      entries.set(path, child)
      continue
    }

    for (const [nested, message] of flatten(child, path)) {
      entries.set(nested, message)
    }
  }

  return entries
}

/**
 * 翻訳の抜けは `fallbackLocale` に吸収され、英語のページに日本語が混ざった形で
 * 表示される。画面上は壊れて見えないため気づきにくい。キーの過不足をここで
 * 機械的に確かめる。
 */
describe('翻訳ファイル', () => {
  // 既定のロケールを基準に、他の言語の過不足を見る。
  const referenceKeys = [...flatten(messages('ja')).keys()].toSorted()

  it('日本語と英語が揃っている', () => {
    expect(localeCodes.toSorted()).toEqual(['en', 'ja'])
  })

  it.each(localeCodes.filter((code) => code !== 'ja'))(
    '%s のキーが日本語と一致する',
    (code) => {
      expect([...flatten(messages(code)).keys()].toSorted()).toEqual(
        referenceKeys,
      )
    },
  )

  it.each(localeCodes)('%s のメッセージが空でない', (code) => {
    for (const [key, message] of flatten(messages(code))) {
      expect(message.trim(), key).not.toBe('')
    }
  })

  // AGENTS.md の規約。インデントや字下げ、単語の区切りにも用いない。
  it('日本語のメッセージに全角スペースを含まない', () => {
    for (const [key, message] of flatten(messages('ja'))) {
      expect(message, key).not.toContain('　')
    }
  })

  /**
   * 補間は名前付きのプレースホルダだけを使う。`{0}` のような位置指定は、
   * 語順が変わる言語で意味を保てない。
   */
  it.each(localeCodes)('%s の補間が名前付きである', (code) => {
    for (const [key, message] of flatten(messages(code))) {
      expect(message.match(/\{\d+\}/), key).toBeNull()
    }
  })
})
