import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import BlogSlugPage from '../../../../app/pages/blog/[slug].vue'
import { createBlogArticle } from '../../../helpers/fixtures'

const { queryCollectionMock, firstMock, routeParams } = vi.hoisted(() => ({
  firstMock: vi.fn(),
  routeParams: { slug: 'sample-article' },
  queryCollectionMock: vi.fn(() => ({
    path: vi.fn(() => ({ first: vi.fn() })),
  })),
}))

mockNuxtImport('useRoute', () => () => ({ params: routeParams }))
mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('ブログの詳細ページ', () => {
  it('ルートのslugから記事のパスを組み立ててBlogArticleへ渡す', async () => {
    const pathMock = vi.fn(() => ({ first: firstMock }))
    queryCollectionMock.mockReturnValue({ path: pathMock })
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/sample-article', 'サンプル記事'),
    )

    const component = await mountSuspended(BlogSlugPage)

    expect(pathMock).toHaveBeenCalledWith('/blog/sample-article')
    expect(component.find('h1').text()).toBe('サンプル記事')
  })
})
