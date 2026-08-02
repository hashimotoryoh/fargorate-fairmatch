import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const CONTENT_DIR = join(ROOT, 'content')

/** 対応する言語。`content/` の直下がそのままロケールのディレクトリになる。 */
const LOCALES = readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

function faqSource(locale: string): string {
  return readFileSync(join(CONTENT_DIR, locale, 'faq.csv'), 'utf8')
}

/**
 * ヘッダー行を除いた行数（＝質問の数）を返す。
 *
 * 回答に改行を含めない運用にしているため、フィールド内のカンマやダブル
 * クォートの有無に関わらず、改行での分割だけで行数を数えて問題ない。
 */
function questionCount(locale: string): number {
  return faqSource(locale)
    .trim()
    .split('\n')
    .slice(1)
    .filter((line) => line.length > 0).length
}

/**
 * FAQは `content/<ロケール>/faq.csv` の1ファイルに、質問と回答を1行1件で
 * まとめて管理している。日英で質問数がずれると、その言語で開いたときだけ
 * 質問が足りなくなるため、対応を機械的に確かめる。
 */
describe('FAQ', () => {
  it('日本語と英語のディレクトリがある', () => {
    expect(LOCALES).toEqual(expect.arrayContaining(['ja', 'en']))
  })

  it.each(LOCALES)('%s のFAQのヘッダー行がquestion,answerである', (locale) => {
    const [header] = faqSource(locale).split('\n')

    expect(header).toBe('question,answer')
  })

  it('少なくとも1件の質問がある', () => {
    expect(questionCount('ja')).toBeGreaterThan(0)
  })

  it('日本語と英語で質問の数が一致する', () => {
    expect(questionCount('en')).toBe(questionCount('ja'))
  })

  it.each(LOCALES)('%s のFAQに全角スペースを含まない', (locale) => {
    expect(faqSource(locale)).not.toContain('　')
  })
})
