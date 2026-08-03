import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))
const PAGES_DIR = join(ROOT, 'app/pages')

/** `description: () => t('seo.<キー>.description')` からキーを取り出す。 */
const DESCRIPTION_PATTERN =
  /(?<!og)description: \(\) => t\('seo\.([\w[\]-]+)\.description'\)/g

function pagePaths(): string[] {
  return readdirSync(PAGES_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.vue'))
    .map((entry) => join(entry.parentPath ?? entry.path, entry.name))
}

/**
 * `og:description` は `description` と同じ文言にする方針である。ページ側で
 * 双方へ同じキーを渡す形にしてあり、`description` から自動では導出されない
 * （unhead の `InferSeoMetaPlugin` は `titleTemplate` の `%s` を展開できず、
 * このリポジトリの構成では使えない）。
 *
 * 片方だけ書くと、そのページだけ `og:description` が出ない状態になる。
 * 実際 `/faq` がその状態のまま残っていたため、機械的に検査する。
 */
describe('ページのSEOメタ', () => {
  it('description を出すページは同じキーで ogDescription も出す', () => {
    const missing = pagePaths().filter((path) => {
      const source = readFileSync(path, 'utf8')

      return [...source.matchAll(DESCRIPTION_PATTERN)].some(
        ([, key]) =>
          !source.includes(`ogDescription: () => t('seo.${key}.description')`),
      )
    })

    expect(missing).toEqual([])
  })

  /**
   * 接尾辞は `nuxt.config.ts` の `templateParams` と `app/app.vue` の
   * `ogTitle` に一本化してある。ページ側で書くと二重管理になる。
   */
  it('ページ側で ogTitle を書かない', () => {
    const written = pagePaths().filter((path) =>
      readFileSync(path, 'utf8').includes('ogTitle:'),
    )

    expect(written).toEqual([])
  })
})
