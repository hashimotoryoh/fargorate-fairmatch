import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppDock from '../../../app/components/AppDock.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

describe('AppDock', () => {
  it('ヘッダーと同じ主要ナビゲーションを並べる', async () => {
    const component = await mountSuspended(AppDock)
    const links = component.findAll('a')

    expect(links.map((link) => link.attributes('href'))).toEqual(
      mainNavItems.map((item) => item.to),
    )
    expect(links.map((link) => link.text())).toEqual(
      mainNavItems.map((item) => jaMessage(item.labelKey)),
    )
  })

  it('各項目にアイコンを描く', async () => {
    const component = await mountSuspended(AppDock)

    component.findAll('a').forEach((link, index) => {
      const paths = link.findAll('path').map((path) => path.attributes('d'))

      expect(paths).toEqual(mainNavItems[index]?.iconPaths)
    })
  })

  // アイコンの隣に必ず表示名があるため、装飾として読み上げから外す。
  it('アイコンを読み上げの対象から外す', async () => {
    const component = await mountSuspended(AppDock)

    for (const svg of component.findAll('svg')) {
      expect(svg.attributes('aria-hidden')).toBe('true')
    }
  })

  // デスクトップ幅ではヘッダーのナビゲーションが出るため、ドックは隠す。
  it('デスクトップ幅では隠す', async () => {
    const component = await mountSuspended(AppDock)

    expect(component.find('nav').classes()).toContain('dock')
    expect(component.find('nav').classes()).toContain('sm:hidden')
  })
})
