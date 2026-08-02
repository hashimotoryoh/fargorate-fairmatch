import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const BLOG_DIR = join(ROOT, 'content')
const PUBLIC_DIR = join(ROOT, 'public')

/** 対応する言語。`content/` の直下がそのままロケールのディレクトリになる。 */
const LOCALES = readdirSync(BLOG_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

function articleSlugs(locale: string): string[] {
  const dir = join(BLOG_DIR, locale, 'blog')

  return readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => basename(file, '.md'))
}

function articleSource(locale: string, slug: string): string {
  return readFileSync(join(BLOG_DIR, locale, 'blog', `${slug}.md`), 'utf8')
}

/** ロケールとスラッグの全ての組み合わせ。 */
function articles(): [string, string][] {
  return LOCALES.flatMap((locale) =>
    articleSlugs(locale).map((slug): [string, string] => [locale, slug]),
  )
}

/**
 * ブログ記事は `content/<ロケール>/blog/` にあり、`/blog/<スラッグ>` として
 * 日英を厳密に1対1でペアリングする運用にしている（アップデート内容やお知らせは
 * どちらの言語でも同じ情報を届けたいため）。片方の言語にしか記事が無いと、
 * その言語で開いたときだけ404になるため、対応を機械的に確かめる。
 */
describe('ブログ記事', () => {
  const slugs = articleSlugs('ja')

  it('日本語と英語のディレクトリがある', () => {
    expect(LOCALES).toEqual(expect.arrayContaining(['ja', 'en']))
  })

  it('少なくとも1件の記事がある', () => {
    expect(slugs.length).toBeGreaterThan(0)
  })

  it.each(LOCALES)('%s に全ての記事が揃っている', (locale) => {
    expect(articleSlugs(locale).toSorted()).toEqual(slugs.toSorted())
  })

  /**
   * `title`・`description`・`date` はスキーマ上必須だが、欠けても
   * コレクションのバリデーションで気づけるとは限らないタイミングがあるため、
   * ここでも形式まで含めて確かめる。`updatedAt`・`image` は任意項目のため、
   * 書かれている場合だけ形式を見る。
   */
  it.each(articles())(
    '%s の %s がフロントマターに必要な項目を持つ',
    (locale, slug) => {
      const source = articleSource(locale, slug)

      expect(source).toMatch(/^---\n(?:.*\n)*?title: .+\n/)
      expect(source).toMatch(/\ndescription: .+\n/)
      expect(source).toMatch(/\ndate: '\d{4}-\d{2}-\d{2}'\n/)
    },
  )

  it.each(articles())(
    '%s の %s の updatedAt は書かれていれば日付形式である',
    (locale, slug) => {
      const source = articleSource(locale, slug)
      const match = source.match(/\nupdatedAt: (.+)\n/)

      if (match) {
        expect(match[1]).toMatch(/^'\d{4}-\d{2}-\d{2}'$/)
      }
    },
  )

  it.each(articles())(
    '%s の %s の image は書かれていれば public/ に実在するファイルを指す',
    (locale, slug) => {
      const source = articleSource(locale, slug)
      const match = source.match(/\nimage: (.+)\n/)

      if (match) {
        const imagePath = match[1]

        expect(imagePath).toMatch(/^\/\S+$/)
        expect(existsSync(join(PUBLIC_DIR, imagePath))).toBe(true)
      }
    },
  )

  // 見出しは `title` から出しているため、本文の側でh1を重ねない。
  it.each(articles())('%s の %s の本文にh1を書かない', (locale, slug) => {
    const body = articleSource(locale, slug)
      .split(/^---$/m)
      .slice(2)
      .join('---')

    expect(body).not.toMatch(/^# /m)
  })

  it.each(articles())('%s の %s に全角スペースを含まない', (locale, slug) => {
    expect(articleSource(locale, slug)).not.toContain('　')
  })
})
