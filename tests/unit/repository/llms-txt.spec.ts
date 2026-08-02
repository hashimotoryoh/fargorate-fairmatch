import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
  'utf8',
)

/**
 * 保護ページのパス一覧。ここで独自に列挙すると、保護ページが増えたときに
 * このテストだけ追随せず検知が漏れる。`sitemap.exclude`（`app/pages/` との
 * 網羅性は `page-protection.spec.ts` が検査済み）から取り出して使い回す。
 */
function protectedPagePaths(): string[] {
  const exclude = source.match(/exclude: \[(.*?)\]/s)?.[1] ?? ''

  return [...exclude.matchAll(/'([^']+)'/g)].map(([, path]) => path)
}

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

  it('日本語コレクション（documents_ja・blog_ja）を参照していない', () => {
    const block = llmsSectionsBlock()

    expect(block).not.toContain("'documents_ja'")
    expect(block).not.toContain("'blog_ja'")
  })

  it('英語コレクション（documents_en・blog_en）を raw markdown から除外していない', () => {
    // 改行を挟んで折り返されても検査できるよう、dotAll（s）フラグを付ける。
    const excludeCollections =
      llmsBlock().match(/excludeCollections: \[(.*?)\]/s)?.[1] ?? ''

    expect(excludeCollections).not.toContain("'documents_en'")
    expect(excludeCollections).not.toContain("'blog_en'")
  })

  it.each(protectedPagePaths())(
    '保護ページ %s へのリンクを含んでいない',
    (path) => {
      const block = llmsSectionsBlock()

      expect(block).not.toContain(path)
      expect(block).not.toContain(`/en${path}`)
    },
  )
})
