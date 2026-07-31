import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { basename, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PAGES_DIR = fileURLToPath(new URL('../../../app/pages', import.meta.url))

/**
 * 認証なしでアクセスできるページ。検索エンジンに開放するページと一致する。
 * ここを増やすことは公開範囲を広げることなので、意図せず増えないよう明示する。
 */
const PUBLIC_PAGES = ['index', 'lookup']

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

  it('lookup ページが guest ミドルウェアを宣言している', () => {
    expect(pageSource('lookup')).toMatch(
      /definePageMeta\(\{[^}]*middleware:\s*'guest'/,
    )
  })

  /**
   * nuxt-auth-utils はプリレンダやキャッシュの際にサーバー側のセッション取得を
   * 飛ばすため、保護ページにこれらを付けると認証済みユーザーが未認証と判定される。
   */
  it('保護ページに prerender や ISR・SWR を宣言していない', () => {
    for (const name of protectedPages) {
      expect(pageSource(name)).not.toMatch(/prerender|isr|swr/i)
    }
  })
})
