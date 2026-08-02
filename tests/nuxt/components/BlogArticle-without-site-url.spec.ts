import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import BlogArticle from '../../../app/components/BlogArticle.vue'
import { createBlogArticle } from '../../helpers/fixtures'

const { queryCollectionMock, firstMock } = vi.hoisted(() => {
  const firstMock = vi.fn()

  return {
    firstMock,
    queryCollectionMock: vi.fn(() => ({
      path: vi.fn(() => ({ first: firstMock })),
    })),
  }
})

mockNuxtImport('queryCollection', () => queryCollectionMock)

function head(selector: string) {
  return document.head.querySelector(selector)
}

/**
 * 公開URLが未設定のときの `BlogArticle`。
 *
 * 「出さない」ことを確かめるには、他のテストが出したタグが残っていない head が
 * 要る。unhead はコンポーネントを外してもタグをDOMに残すため、公開URLを設定
 * するテスト（`BlogArticle.spec.ts`）とはファイルごと分ける。
 */
describe('BlogArticle（公開URLが未設定）', () => {
  // 誤ったドメインを指す og:image やJSON-LDは、無いことより害がある。
  it('OGP画像と構造化データを出さない', async () => {
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/blog-page-launch', 'ブログページを公開しました'),
    )

    await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })
    await flushPromises()

    expect(head('meta[property="og:image"]')).toBeNull()
    expect(head('script[type="application/ld+json"]')).toBeNull()
  })
})
