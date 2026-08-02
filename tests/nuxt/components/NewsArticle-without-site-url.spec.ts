import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import NewsArticle from '../../../app/components/NewsArticle.vue'
import { createNewsArticle } from '../../helpers/fixtures'

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
 * 公開URLが未設定のときの `NewsArticle`。
 *
 * 「出さない」ことを確かめるには、他のテストが出したタグが残っていない head が
 * 要る。unhead はコンポーネントを外してもタグをDOMに残すため、公開URLを設定
 * するテスト（`NewsArticle.spec.ts`）とはファイルごと分ける。
 */
describe('NewsArticle（公開URLが未設定）', () => {
  // 誤ったドメインを指す og:image やJSON-LDは、無いことより害がある。
  it('OGP画像と構造化データを出さない', async () => {
    firstMock.mockResolvedValue(
      createNewsArticle(
        '/news/news-page-launch',
        'ニュースページを公開しました',
      ),
    )

    await mountSuspended(NewsArticle, {
      props: { path: '/news/news-page-launch' },
    })
    await flushPromises()

    expect(head('meta[property="og:image"]')).toBeNull()
    expect(head('script[type="application/ld+json"]')).toBeNull()
  })
})
