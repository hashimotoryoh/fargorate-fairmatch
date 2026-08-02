import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import NewsSlugPage from '../../../../app/pages/news/[slug].vue'
import { createNewsArticle } from '../../../helpers/fixtures'

const { queryCollectionMock, firstMock, routeParams } = vi.hoisted(() => ({
  firstMock: vi.fn(),
  routeParams: { slug: 'sample-article' },
  queryCollectionMock: vi.fn(() => ({
    path: vi.fn(() => ({ first: vi.fn() })),
  })),
}))

mockNuxtImport('useRoute', () => () => ({ params: routeParams }))
mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('お知らせの詳細ページ', () => {
  it('ルートのslugから記事のパスを組み立ててNewsArticleへ渡す', async () => {
    const pathMock = vi.fn(() => ({ first: firstMock }))
    queryCollectionMock.mockReturnValue({ path: pathMock })
    firstMock.mockResolvedValue(
      createNewsArticle('/news/sample-article', 'サンプル記事'),
    )

    const component = await mountSuspended(NewsSlugPage)

    expect(pathMock).toHaveBeenCalledWith('/news/sample-article')
    expect(component.find('h1').text()).toBe('サンプル記事')
  })
})
