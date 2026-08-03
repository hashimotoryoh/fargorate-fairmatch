import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import IndexPage from '../../../app/pages/index.vue'
import { jaMessage } from '../../helpers/i18n'

describe('トップページ', () => {
  /**
   * タイトルは「タイトル - サイト名」で組み立てる。接尾辞と区切りは
   * `nuxt.config.ts` の `templateParams` に一本化してあり、ページ側では
   * 書かない。ここが崩れると、ページを足すたびに書き忘れが起きる。
   *
   * og:title が同じテンプレートを使うことは `tests/nuxt/app.spec.ts` で見る。
   * 既定のOGPは `app.vue` にあり、ページ単体のマウントでは載らないため。
   */
  it('タイトルをサイト名と組み合わせて出す', async () => {
    await mountSuspended(IndexPage)

    await vi.waitFor(() => {
      expect(document.title).toBe(
        `${jaMessage('seo.index.title')} - FargoRate FairMatch`,
      )
    })
  })

  it('アプリ名と概要を見出しに出す', async () => {
    const component = await mountSuspended(IndexPage)

    expect(component.find('h1').text()).toBe('FargoRate FairMatch')
    expect(component.text()).toContain(jaMessage('index.lead'))
  })

  it('できることを3つ並べる', async () => {
    const component = await mountSuspended(IndexPage)
    const features = component.findAll('.card h3')

    expect(features).toHaveLength(3)
    expect(features.map((feature) => feature.text())).toEqual([
      jaMessage('index.features.record.title'),
      jaMessage('index.features.review.title'),
      jaMessage('index.features.rating.title'),
    ])
  })

  it('レーティングの目安を初級者からプロまで示す', async () => {
    const component = await mountSuspended(IndexPage)
    const rows = component.findAll('tbody tr')

    expect(rows.map((row) => row.find('th').text())).toEqual([
      jaMessage('index.ratingGuide.beginner.level'),
      jaMessage('index.ratingGuide.intermediate.level'),
      jaMessage('index.ratingGuide.advanced.level'),
      jaMessage('index.ratingGuide.professional.level'),
    ])
  })

  it('リンクページへの導線を上下に置く', async () => {
    const component = await mountSuspended(IndexPage)
    const links = component.findAll('a[href="/link"]')

    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.text()).toBe(jaMessage('index.start'))
    }
  })

  /**
   * このアプリは対戦結果を公式システムへ送らない。レーティングが変わると
   * 誤解されると利用の判断を誤らせるため、紹介ページで必ず断る。
   */
  it('レーティングを更新しないことを明記する', async () => {
    const component = await mountSuspended(IndexPage)

    expect(jaMessage('index.gettingStartedNote')).toContain(
      '対戦結果を公式システムへ送信することはありません',
    )
    expect(component.text()).toContain(jaMessage('index.gettingStartedNote'))
  })
})
