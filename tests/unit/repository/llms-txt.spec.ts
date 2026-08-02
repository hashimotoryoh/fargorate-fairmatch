import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
  'utf8',
)

/** page-protection.spec.ts の PUBLIC_PAGES と対になる、保護対象のページ名。 */
const PROTECTED_PAGES = ['dashboard', 'game', 'settings']

function llmsBlock(): string {
  const match = source.match(/\n {2}llms: \{[\s\S]*?\n {2}\},\n {2}css:/)

  if (!match) {
    throw new Error('nuxt.config.ts に llms の設定ブロックが見つからない')
  }

  return match[0]
}

/**
 * `sections` だけを取り出す。`contentRawMarkdown.excludeCollections` は
 * 日本語コレクションを意図的に列挙する箇所なので、参照禁止の検査対象から
 * 外すため。
 */
function llmsSectionsBlock(): string {
  const match = llmsBlock().match(/sections: \[[\s\S]*?\n {2}\},\n {2}css:/)

  if (!match) {
    throw new Error('nuxt.config.ts に llms.sections が見つからない')
  }

  return match[0]
}

/**
 * `/llms.txt` は日本語コレクションを含めず、英語だけの単一ファイルとして
 * 公開する方針にしてある（AGENTS.md参照）。壊れても画面上は正常に見えて
 * しまう類のものなので、リポジトリ規約として機械的に固定する。
 */
describe('llms.txt の設定', () => {
  it('domain が別のドメイン文字列でなく SITE_URL を参照している', () => {
    expect(llmsBlock()).toMatch(/domain: SITE_URL/)
  })

  it('日本語コレクション（documents_ja・news_ja）を参照していない', () => {
    const block = llmsSectionsBlock()

    expect(block).not.toContain("'documents_ja'")
    expect(block).not.toContain("'news_ja'")
  })

  it('英語コレクション（documents_en・news_en）を raw markdown から除外していない', () => {
    const excludeCollections =
      llmsBlock().match(/excludeCollections: \[(.*?)\]/)?.[1] ?? ''

    expect(excludeCollections).not.toContain("'documents_en'")
    expect(excludeCollections).not.toContain("'news_en'")
  })

  it.each(PROTECTED_PAGES)('保護ページ %s へのリンクを含んでいない', (name) => {
    const block = llmsSectionsBlock()

    expect(block).not.toContain(`/${name}`)
    expect(block).not.toContain(`/en/${name}`)
  })
})
