import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/__sitemap__/blog'
import { callHandler } from '../../../../helpers/h3'

/**
 * `/blog/[slug]` は動的ルートで、ページのルート定義からはスラッグを列挙
 * できない。このハンドラーがNuxt Contentから記事のパスを集めて
 * サイトマップ用の形に変換していることを確かめる。
 */
describe('GET /api/__sitemap__/blog', () => {
  const selectMock = vi.fn()
  const allMock = vi.fn()

  beforeEach(() => {
    selectMock.mockReturnValue({ all: allMock })
    vi.stubGlobal(
      'queryCollection',
      vi.fn(() => ({ select: selectMock })),
    )
  })

  it('既定ロケールの記事パスをサイトマップの形で返す', async () => {
    allMock.mockResolvedValue([
      { path: '/blog/sample-article', date: '2026-08-01', updatedAt: null },
    ])

    const response = await callHandler(handler, undefined)

    expect(response.body).toEqual([
      {
        loc: '/blog/sample-article',
        lastmod: '2026-08-01',
        _i18nTransform: true,
      },
    ])
  })

  // 通常のページと同じくロケール接頭辞付きのURLとhreflangを@nuxtjs/sitemap側に
  // 自動で組み立てさせるための指定なので、欠けると英語版が漏れる。
  it('_i18nTransformを付けてロケール展開を促す', async () => {
    allMock.mockResolvedValue([
      { path: '/blog/sample-article', date: '2026-08-01', updatedAt: null },
    ])

    const response = await callHandler(handler, undefined)

    expect(
      (response.body as { _i18nTransform: boolean }[])[0]._i18nTransform,
    ).toBe(true)
  })

  // 改訂されていれば改訂日を、無ければ公開日をそのまま最終更新として使う。
  it('updatedAtがあればlastmodに使う', async () => {
    allMock.mockResolvedValue([
      {
        path: '/blog/revised-article',
        date: '2026-08-01',
        updatedAt: '2026-08-02',
      },
    ])

    const response = await callHandler(handler, undefined)

    expect((response.body as { lastmod: string }[])[0].lastmod).toBe(
      '2026-08-02',
    )
  })

  it('記事が無ければ空配列を返す', async () => {
    allMock.mockResolvedValue([])

    const response = await callHandler(handler, undefined)

    expect(response.body).toEqual([])
  })
})
