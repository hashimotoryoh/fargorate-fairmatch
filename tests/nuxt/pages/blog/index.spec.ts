import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BlogIndexPage from '../../../../app/pages/blog/index.vue'
import { createBlogArticle } from '../../../helpers/fixtures'
import { jaMessage } from '../../../helpers/i18n'

const { queryCollectionMock, allMock, orderMock } = vi.hoisted(() => {
  const allMock = vi.fn()
  const orderMock = vi.fn(() => ({ all: allMock }))

  return {
    allMock,
    orderMock,
    // `queryCollection('blog_ja').order('date', 'DESC').all()` の連鎖を模す。
    queryCollectionMock: vi.fn(() => ({ order: orderMock })),
  }
})

mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('ブログの一覧ページ', () => {
  // useAsyncData はロケール単位でキャッシュするため、テストごとに一覧を洗い直す。
  beforeEach(() => {
    clearNuxtData()
  })

  it('記事を公開日の新しい順に並べて出す', async () => {
    // 並び替え自体はクエリ（`order('date', 'DESC')`）が担うため、ページは
    // 受け取った順をそのまま出す。新しい順で返ってきた体で検証する。
    allMock.mockResolvedValue([
      createBlogArticle('/blog/newer', '新しい記事', { date: '2026-08-01' }),
      createBlogArticle('/blog/older', '古い記事', { date: '2026-07-01' }),
    ])

    const component = await mountSuspended(BlogIndexPage)

    expect(queryCollectionMock).toHaveBeenCalledWith('blog_ja')
    expect(orderMock).toHaveBeenCalledWith('date', 'DESC')

    const titles = component.findAll('.card-title')
    expect(titles.map((title) => title.text())).toEqual([
      '新しい記事',
      '古い記事',
    ])
  })

  it('各記事のカードから記事のパスへ辿れる', async () => {
    allMock.mockResolvedValue([
      createBlogArticle('/blog/sample-article', 'サンプル記事'),
    ])

    const component = await mountSuspended(BlogIndexPage)

    expect(component.find('a[href="/blog/sample-article"]').exists()).toBe(true)
  })

  it('記事が無ければその旨を出す', async () => {
    allMock.mockResolvedValue([])

    const component = await mountSuspended(BlogIndexPage)

    expect(component.text()).toContain(jaMessage('blog.empty'))
  })

  it('記事固有の画像があればカードの画像に使う', async () => {
    allMock.mockResolvedValue([
      createBlogArticle('/blog/with-image', '画像のある記事', {
        image: '/img/blog/with-image.png',
      }),
    ])

    const component = await mountSuspended(BlogIndexPage)
    const image = component.find('img')

    expect(image.attributes('src')).toContain('/img/blog/with-image.png')
    expect(image.attributes('alt')).toBe('画像のある記事')
  })

  // フロントマターに image が無ければ、カードの画像も既定のOGP画像にフォールバックする。
  it('記事固有の画像が無ければカードの画像に既定のOGP画像を使う', async () => {
    allMock.mockResolvedValue([
      createBlogArticle('/blog/no-image', '画像の無い記事'),
    ])

    const component = await mountSuspended(BlogIndexPage)
    const image = component.find('img')

    expect(image.attributes('src')).toContain('/img/ogp.png')
  })
})
