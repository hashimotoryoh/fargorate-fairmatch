import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const PAGES_DIR = join(ROOT, 'app/pages')
const LAYOUTS_DIR = join(ROOT, 'app/layouts')

/**
 * 認証なしでアクセスできるページ。検索エンジンに開放するページと一致する。
 * ここを増やすことは公開範囲を広げることなので、意図せず増えないよう明示する。
 */
const PUBLIC_PAGES = [
  'index',
  'link',
  'guest',
  'lookup',
  'privacy-policy',
  'terms-conditions',
  'blog/index',
  'blog/[slug]',
  'faq',
]

/** 認証済みのユーザーを追い返すページ。認証の入口が対象。 */
const GUEST_ONLY_PAGES = ['link', 'guest']

/**
 * 保護ページが使ってよいレイアウト。どちらも `noindex` をまとめて宣言して
 * いることを後段で確かめる。
 */
const PROTECTED_LAYOUTS = ['authenticated', 'game']

/**
 * `app/pages/` 配下を再帰的に辿り、`.vue` の拡張子を除いた相対パスを返す
 * （例: `blog/index`、`blog/[slug]`）。ブログ一覧・詳細のようにディレクトリを
 * 持つページも同じ規約で検査できるようにするため、トップレベルに限定しない。
 */
function pageNames(): string[] {
  return readdirSync(PAGES_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.vue'))
    .map((entry) =>
      join(entry.parentPath ?? entry.path, entry.name)
        .slice(PAGES_DIR.length + 1)
        .replaceAll('\\', '/')
        .replace(/\.vue$/, ''),
    )
}

function pageSource(name: string): string {
  return readFileSync(join(PAGES_DIR, `${name}.vue`), 'utf8')
}

/** ページ名を実際のルートのパスへ直す（`games/index` → `/games`）。 */
function routePath(name: string): string {
  return `/${name}`.replace(/\/index$/, '') || '/'
}

/**
 * 保護対象のパスをどこかに配列で列挙する形は採っていない。ページを追加する
 * たびに更新が必要になり、更新漏れがそのまま情報の露出になるためである。
 * その代わり、追加したページが `definePageMeta` で保護を宣言していることを
 * ここで機械的に確かめる。
 */
describe('ページの保護の宣言', () => {
  const protectedPages = pageNames().filter(
    (name) => !PUBLIC_PAGES.includes(name),
  )

  it('公開ページ以外が存在する', () => {
    expect(protectedPages.length).toBeGreaterThan(0)
  })

  it.each(protectedPages)(
    '%s ページが auth ミドルウェアと保護レイアウトを宣言している',
    (name) => {
      const source = pageSource(name)

      expect(source).toMatch(/definePageMeta\(\{[^}]*middleware:\s*'auth'/)
      expect(source).toMatch(
        new RegExp(
          `definePageMeta\\(\\{[^}]*layout:\\s*'(${PROTECTED_LAYOUTS.join('|')})'`,
        ),
      )
    },
  )

  /**
   * ページごとの `noindex` 宣言を省く根拠が、保護レイアウト側でまとめて
   * 宣言していることなので、その前提をレイアウト側で固定する。
   */
  it.each(PROTECTED_LAYOUTS)(
    '%s レイアウトが noindex を宣言している',
    (name) => {
      const source = readFileSync(join(LAYOUTS_DIR, `${name}.vue`), 'utf8')

      expect(source).toContain("robots: 'noindex, nofollow'")
    },
  )

  it.each(PUBLIC_PAGES)('%s ページは auth ミドルウェアを付けない', (name) => {
    expect(pageSource(name)).not.toMatch(/middleware:\s*'auth'/)
  })

  it.each(GUEST_ONLY_PAGES)(
    '%s ページが guest ミドルウェアを宣言している',
    (name) => {
      expect(pageSource(name)).toMatch(
        /definePageMeta\(\{[^}]*middleware:\s*'guest'/,
      )
    },
  )

  /**
   * nuxt-auth-utils はプリレンダやキャッシュの際にサーバー側のセッション取得を
   * 飛ばすため、保護ページにこれらを付けると認証済みユーザーが未認証と判定される。
   */
  it('保護ページに prerender や ISR・SWR を宣言していない', () => {
    for (const name of protectedPages) {
      expect(pageSource(name)).not.toMatch(/prerender|isr|swr/i)
    }
  })

  /**
   * sitemap の除外と robots.txt の Disallow（@nuxtjs/robots が動的生成する）は、
   * 性質上どうしても保護ページの列挙になる。`nuxt.config.ts` の
   * `PROTECTED_PAGE_PATHS` にその列挙を一本化してあり、ページを足したときに
   * 書き漏らすと非公開のページが検索エンジンへ案内されてしまうため、
   * `app/pages/` から導いた一覧と突き合わせる。`/games/briefing` のような
   * 配下のページは、親のパスが列挙されていれば覆われている。
   */
  it('PROTECTED_PAGE_PATHS が保護ページを網羅している', () => {
    const config = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    const listed = [
      ...(config.match(/PROTECTED_PAGE_PATHS = \[(.*?)\]/s)?.[1] ?? '').matchAll(
        /'([^']+)'/g,
      ),
    ].map(([, path]) => path)

    expect(listed.length).toBeGreaterThan(0)

    for (const name of protectedPages) {
      const route = routePath(name)
      const covered = listed.some(
        (path) => route === path || route.startsWith(`${path}/`),
      )

      expect(covered, `${route} が PROTECTED_PAGE_PATHS に覆われていない`).toBe(
        true,
      )
    }
  })

  it('sitemap の除外と robots.txt の Disallow が PROTECTED_PAGE_PATHS を共有している', () => {
    const config = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')

    expect(config).toMatch(/exclude: PROTECTED_PAGE_PATHS\.flatMap/)
    expect(config).toContain('disallow: PROTECTED_PAGE_PATHS')
  })
})
