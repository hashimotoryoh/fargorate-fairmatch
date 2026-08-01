import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
  'utf8',
)

/**
 * 公開URLは、OGPの絶対URL・hreflang・sitemap の3か所が必要とする。
 *
 * それぞれに別の環境変数を用意すると、片方だけ設定された状態が起きる。
 * 誤ったドメインを指す canonical や hreflang は、無いことより害があるため、
 * 出所が1つであることを機械的に確かめる。
 */
describe('公開URLの受け渡し', () => {
  it('NUXT_PUBLIC_SITE_URL を1か所でだけ読む', () => {
    expect(source.match(/process\.env\.NUXT_PUBLIC_SITE_URL/g)).toHaveLength(1)
  })

  it('読んだ値を i18n の baseUrl と runtimeConfig の双方へ渡す', () => {
    expect(source).toMatch(
      /const SITE_URL = process\.env\.NUXT_PUBLIC_SITE_URL/,
    )
    expect(source).toMatch(/baseUrl: SITE_URL/)
    expect(source).toMatch(/siteUrl: SITE_URL/)
  })
})
