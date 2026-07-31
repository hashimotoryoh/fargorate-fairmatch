import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const CONTENT_DIR = join(ROOT, 'content')
const PAGES_DIR = join(ROOT, 'app/pages')

function documentNames(): string[] {
  return readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith('.md'))
    .map((file) => basename(file, '.md'))
}

function documentSource(name: string): string {
  return readFileSync(join(CONTENT_DIR, `${name}.md`), 'utf8')
}

/**
 * プライバシーポリシーと利用規約の本文は `content/` のMarkdownにあり、ページは
 * `LegalDocument` にパスを渡すだけである。名前がずれると本文を引けず、ページが
 * 404になる。取り違えは表示するまで気づけないため、対応を機械的に確かめる。
 */
describe('法的なドキュメント', () => {
  const names = documentNames()

  it('プライバシーポリシーと利用規約が揃っている', () => {
    expect(names).toEqual(expect.arrayContaining(['privacy', 'terms']))
  })

  it.each(names)('%s のページが同じ名前のMarkdownを指している', (name) => {
    const page = readFileSync(join(PAGES_DIR, `${name}.vue`), 'utf8')

    expect(page).toContain(`<LegalDocument path="/${name}" />`)
  })

  /**
   * `title` と `description` はページの見出しと `useSeoMeta` に、`updatedAt` は
   * 最終更新日の表示に使う。欠けるとコレクションのスキーマ検証で落ちるが、
   * 改訂のたびに日付を更新し忘れる方が起きやすいので、存在をここでも見る。
   */
  it.each(names)('%s がフロントマターに必要な項目を持つ', (name) => {
    const source = documentSource(name)

    expect(source).toMatch(/^---\n(?:.*\n)*?title: .+\n/)
    expect(source).toMatch(/\ndescription: .+\n/)
    expect(source).toMatch(/\nupdatedAt: '\d{4}-\d{2}-\d{2}'\n/)
  })

  // 見出しは `title` から出しているため、本文の側でh1を重ねない。
  it.each(names)('%s の本文にh1を書かない', (name) => {
    const body = documentSource(name).split(/^---$/m).slice(2).join('---')

    expect(body).not.toMatch(/^# /m)
  })

  it.each(names)('%s に全角スペースを含まない', (name) => {
    expect(documentSource(name)).not.toContain('　')
  })
})
