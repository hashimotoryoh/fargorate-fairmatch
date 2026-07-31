import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '../../../app/pages/index.vue'
import { jaMessage } from '../../helpers/i18n'

describe('トップページ', () => {
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

  it('サインインへの導線を上下に置く', async () => {
    const component = await mountSuspended(IndexPage)
    const links = component.findAll('a[href="/lookup"]')

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
