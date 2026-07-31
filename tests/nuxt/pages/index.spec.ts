import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '../../../app/pages/index.vue'

describe('トップページ', () => {
  it('アプリ名と概要を見出しに出す', async () => {
    const component = await mountSuspended(IndexPage)

    expect(component.find('h1').text()).toBe('FargoRate FairMatch')
    expect(component.text()).toContain('ビリヤード対戦を補助するウェブアプリ')
  })

  it('できることを3つ並べる', async () => {
    const component = await mountSuspended(IndexPage)
    const features = component.findAll('.card h3')

    expect(features).toHaveLength(3)
    expect(features.map((feature) => feature.text())).toEqual([
      'スコアを手元で記録する',
      '対戦成績を振り返る',
      'FargoRateの数値をそのまま使う',
    ])
  })

  it('レーティングの目安を初級者からプロまで示す', async () => {
    const component = await mountSuspended(IndexPage)
    const rows = component.findAll('tbody tr')

    expect(rows.map((row) => row.find('th').text())).toEqual([
      '初級者',
      '中級者',
      '上級者',
      'プロ',
    ])
  })

  it('サインインへの導線を上下に置く', async () => {
    const component = await mountSuspended(IndexPage)
    const links = component.findAll('a[href="/lookup"]')

    expect(links).toHaveLength(2)
    for (const link of links) {
      expect(link.text()).toBe('FargoRate IDで始める')
    }
  })

  /**
   * このアプリは対戦結果を公式システムへ送らない。レーティングが変わると
   * 誤解されると利用の判断を誤らせるため、紹介ページで必ず断る。
   */
  it('レーティングを更新しないことを明記する', async () => {
    const component = await mountSuspended(IndexPage)

    expect(component.text()).toContain(
      '対戦結果を公式システムへ送信することはありません',
    )
  })
})
