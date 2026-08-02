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

  it('各項目にMaterial Design Iconsのアイコンを描く', async () => {
    const component = await mountSuspended(AppDock)
    const icons = component.findAllComponents({ name: 'NuxtIconSvg' })

    expect(icons.map((icon) => icon.props('name'))).toEqual(
      mainNavItems.map((item) => item.icon),
    )
  })

  // デスクトップ幅ではヘッダーのナビゲーションが出るため、ドックは隠す。
  it('デスクトップ幅では隠す', async () => {
    const component = await mountSuspended(AppDock)

    expect(component.find('nav').classes()).toContain('dock')
    expect(component.find('nav').classes()).toContain('sm:hidden')
  })
})
