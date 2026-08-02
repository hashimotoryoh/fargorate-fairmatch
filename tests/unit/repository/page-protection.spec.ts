import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const PAGES_DIR = join(ROOT, 'app/pages')

/** 既定のロケール以外の接頭辞。robots.txt に列挙するために要る。 */
const PREFIXED_LOCALES = ['en']

/**
 * 認証なしでアクセスできるページ。検索エンジンに開放するページと一致する。
 * ここを増やすことは公開範囲を広げることなので、意図せず増えないよう明示する。
 */
const PUBLIC_PAGES = [
  'index',
  'lookup',
  'guest',
  'privacy-policy',
  'terms-conditions',
]

/** 認証済みのユーザーを追い返すページ。サインインの入口が対象。 */
const GUEST_ONLY_PAGES = ['lookup', 'guest']

function pageNames(): string[] {
  return readdirSync(PAGES_DIR)
    .filter((file) => file.endsWith('.vue'))
    .map((file) => basename(file, '.vue'))
}

function pageSource(name: string): string {
  return readFileSync(join(PAGES_DIR, `${name}.vue`), 'utf8')
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
    '%s ページが auth ミドルウェアと authenticated レイアウトを宣言している',
    (name) => {
      const source = pageSource(name)

      expect(source).toMatch(/definePageMeta\(\{[^}]*middleware:\s*'auth'/)
      expect(source).toMatch(/definePageMeta\(\{[^}]*layout:\s*'authenticated'/)
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
   * sitemap の除外と robots.txt は、性質上どうしても保護ページの列挙になる。
   * ページを足したときに書き漏らすと、非公開のページが検索エンジンへ案内
   * されてしまうため、`app/pages/` から導いた一覧と突き合わせる。
   */
  it('sitemap が保護ページを除外している', () => {
    const config = readFileSync(join(ROOT, 'nuxt.config.ts'), 'utf8')
    const exclude = config.match(/exclude: \[(.*?)\]/s)?.[1] ?? ''

    for (const name of protectedPages) {
      expect(exclude).toContain(`'/${name}'`)
    }
  })

  it('robots.txt が保護ページを全てのロケールで拒否している', () => {
    const robots = readFileSync(join(ROOT, 'public/robots.txt'), 'utf8')

    for (const name of protectedPages) {
      expect(robots).toContain(`Disallow: /${name}\n`)

      for (const locale of PREFIXED_LOCALES) {
        expect(robots).toContain(`Disallow: /${locale}/${name}\n`)
      }
    }
  })
})
