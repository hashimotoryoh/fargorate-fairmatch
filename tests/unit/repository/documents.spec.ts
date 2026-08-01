import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const CONTENT_DIR = join(ROOT, 'content')
const PAGES_DIR = join(ROOT, 'app/pages')

/** 対応する言語。`content/` の直下がそのままロケールのディレクトリになる。 */
const LOCALES = readdirSync(CONTENT_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

function documentNames(locale: string): string[] {
  return readdirSync(join(CONTENT_DIR, locale))
    .filter((file) => file.endsWith('.md'))
    .map((file) => basename(file, '.md'))
}

function documentSource(locale: string, name: string): string {
  return readFileSync(join(CONTENT_DIR, locale, `${name}.md`), 'utf8')
}

/** ロケールとドキュメント名の全ての組み合わせ。 */
function documents(): [string, string][] {
  return LOCALES.flatMap((locale) =>
    documentNames(locale).map((name): [string, string] => [locale, name]),
  )
}

/**
 * Markdownで管理するドキュメントの本文は `content/<ロケール>/` にあり、ページは
 * `MarkdownDocument` にパスを渡すだけである。名前がずれると本文を引けず、
 * ページが404になる。取り違えは表示するまで気づけないため、対応を機械的に確かめる。
 */
describe('Markdownで管理するドキュメント', () => {
  // 既定のロケールを基準に、他の言語の過不足を見る。
  const names = documentNames('ja')

  /**
   * 言語を増やす作業を設定と翻訳ファイルの追加だけで終わらせたいため、
   * 一致ではなく存在だけを見る。消えたことは検出しつつ、増えることは許す。
   */
  it('日本語と英語のディレクトリがある', () => {
    expect(LOCALES).toEqual(expect.arrayContaining(['ja', 'en']))
  })

  it('プライバシーポリシーと利用規約が揃っている', () => {
    expect(names).toEqual(
      expect.arrayContaining(['privacy-policy', 'terms-conditions']),
    )
  })

  /**
   * 片方の言語にしか無いドキュメントがあると、その言語で開いたときだけ404に
   * なる。ページは言語によらず存在するため、本文も全ての言語に揃える。
   */
  it.each(LOCALES)('%s に全てのドキュメントが揃っている', (locale) => {
    expect(documentNames(locale).toSorted()).toEqual(names.toSorted())
  })

  it.each(names)('%s のページが同じ名前のMarkdownを指している', (name) => {
    const page = readFileSync(join(PAGES_DIR, `${name}.vue`), 'utf8')

    expect(page).toContain(`<MarkdownDocument path="/${name}" />`)
  })

  /**
   * `title` と `description` はページの見出しと `useSeoMeta` に、`updatedAt` は
   * 最終更新日の表示に使う。欠けるとコレクションのスキーマ検証で落ちるが、
   * 改訂のたびに日付を更新し忘れる方が起きやすいので、存在をここでも見る。
   */
  it.each(documents())(
    '%s の %s がフロントマターに必要な項目を持つ',
    (locale, name) => {
      const source = documentSource(locale, name)

      expect(source).toMatch(/^---\n(?:.*\n)*?title: .+\n/)
      expect(source).toMatch(/\ndescription: .+\n/)
      expect(source).toMatch(/\nupdatedAt: '\d{4}-\d{2}-\d{2}'\n/)
    },
  )

  // 見出しは `title` から出しているため、本文の側でh1を重ねない。
  it.each(documents())('%s の %s の本文にh1を書かない', (locale, name) => {
    const body = documentSource(locale, name)
      .split(/^---$/m)
      .slice(2)
      .join('---')

    expect(body).not.toMatch(/^# /m)
  })

  it.each(documents())('%s の %s に全角スペースを含まない', (locale, name) => {
    expect(documentSource(locale, name)).not.toContain('　')
  })
})
