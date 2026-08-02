import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NewsIndexPage from '../../../../app/pages/news/index.vue'
import { createNewsArticle } from '../../../helpers/fixtures'
import { jaMessage } from '../../../helpers/i18n'

const { queryCollectionMock, allMock, orderMock } = vi.hoisted(() => {
  const allMock = vi.fn()
  const orderMock = vi.fn(() => ({ all: allMock }))

  return {
    allMock,
    orderMock,
    // `queryCollection('news_ja').order('date', 'DESC').all()` の連鎖を模す。
    queryCollectionMock: vi.fn(() => ({ order: orderMock })),
  }
})

mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('お知らせの一覧ページ', () => {
  // useAsyncData はロケール単位でキャッシュするため、テストごとに一覧を洗い直す。
  beforeEach(() => {
    clearNuxtData()
  })

  it('記事を公開日の新しい順に並べて出す', async () => {
    allMock.mockResolvedValue([
      createNewsArticle('/news/older', '古い記事', { date: '2026-07-01' }),
      createNewsArticle('/news/newer', '新しい記事', { date: '2026-08-01' }),
    ])

    const component = await mountSuspended(NewsIndexPage)

    expect(queryCollectionMock).toHaveBeenCalledWith('news_ja')
    expect(orderMock).toHaveBeenCalledWith('date', 'DESC')

    const titles = component.findAll('.card-title')
    expect(titles.map((title) => title.text())).toEqual([
      '古い記事',
      '新しい記事',
    ])
  })

  it('各記事のカードから記事のパスへ辿れる', async () => {
    allMock.mockResolvedValue([
      createNewsArticle('/news/sample-article', 'サンプル記事'),
    ])

    const component = await mountSuspended(NewsIndexPage)

    expect(component.find('a[href="/news/sample-article"]').exists()).toBe(true)
  })

  it('記事が無ければその旨を出す', async () => {
    allMock.mockResolvedValue([])

    const component = await mountSuspended(NewsIndexPage)

    expect(component.text()).toContain(jaMessage('news.empty'))
  })
})
