import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppLogo from '../../../app/components/AppLogo.vue'

describe('AppLogo', () => {
  // ヘッダーでは 24px 前後で表示されるため、色は呼び出し側の文字色に任せる。
  it('currentColor で描き、読み上げの対象から外す', async () => {
    const component = await mountSuspended(AppLogo)
    const svg = component.find('svg')

    expect(svg.attributes('viewBox')).toBe('0 0 24 24')
    expect(svg.find('g[stroke="currentColor"]').exists()).toBe(true)
    expect(svg.attributes('aria-hidden')).toBe('true')
  })

  it('大小2つの球で構成する', async () => {
    const component = await mountSuspended(AppLogo)
    const radiuses = component
      .findAll('circle')
      .map((circle) => Number(circle.attributes('r')))

    expect(radiuses).toHaveLength(2)
    expect(radiuses[0]).toBeGreaterThan(radiuses[1]!)
  })
})
