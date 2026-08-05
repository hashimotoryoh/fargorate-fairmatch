import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Icon } from '#components'
import { describe, expect, it } from 'vitest'
import AppFab from '../../../app/components/AppFab.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

describe('AppFab', () => {
  it('ヘッダーと同じ主要ナビゲーションを並べる', async () => {
    const component = await mountSuspended(AppFab)
    const links = component.findAll('a')

    expect(links.map((link) => link.attributes('href'))).toEqual(
      mainNavItems.map((item) => item.to),
    )
  })

  it('各項目にアイコンを描く', async () => {
    const component = await mountSuspended(AppFab)
    const icons = component
      .findAll('a')
      .map((link) => link.findComponent(Icon).props('name'))

    expect(icons).toEqual(mainNavItems.map((item) => item.icon))
  })

  // アイコンだけのボタンなので、名称はツールチップと読み上げ用ラベルで補う。
  it('各項目の名称をツールチップと読み上げ用ラベルで出す', async () => {
    const component = await mountSuspended(AppFab)
    const tooltips = component.findAll('.tooltip')
    const links = component.findAll('a')

    expect(tooltips.map((tooltip) => tooltip.attributes('data-tip'))).toEqual(
      mainNavItems.map((item) => jaMessage(item.labelKey)),
    )
    expect(links.map((link) => link.attributes('aria-label'))).toEqual(
      mainNavItems.map((item) => jaMessage(item.labelKey)),
    )
  })

  // daisyUIのFABはフォーカスの有無で開閉するため、トリガーが
  // フォーカス可能でないと開けない。
  it('開閉のトリガーがフォーカス可能で読み上げ用ラベルを持つ', async () => {
    const component = await mountSuspended(AppFab)
    const trigger = component.find('[role="button"]')

    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-label')).toBe(jaMessage('nav.open'))
  })

  // デスクトップ幅ではヘッダーのナビゲーションが出るため、FABは隠す。
  it('デスクトップ幅では隠す', async () => {
    const component = await mountSuspended(AppFab)

    expect(component.find('nav').classes()).toContain('fab')
    expect(component.find('nav').classes()).toContain('fab-flower')
    expect(component.find('nav').classes()).toContain('sm:hidden')
  })
})
