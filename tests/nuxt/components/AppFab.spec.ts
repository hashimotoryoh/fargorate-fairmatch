import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { Icon } from '#components'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import AppFab from '../../../app/components/AppFab.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

// mockNuxtImport のファクトリはファイル先頭へ巻き上げられるため、
// 差し替える状態も同じタイミングで用意する必要がある。
const session = vi.hoisted(() => ({ loggedIn: true }))

mockNuxtImport('useUserSession', () => () => ({
  loggedIn: computed(() => session.loggedIn),
}))

describe('AppFab', () => {
  beforeEach(() => {
    session.loggedIn = true
  })

  // ヘッダーのナビゲーションと同じ条件。未認証のユーザーには導けるページが無い。
  it('未認証なら何も描かない', async () => {
    session.loggedIn = false

    const component = await mountSuspended(AppFab)

    expect(component.find('.fab').exists()).toBe(false)
  })

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

  // 最初の項目はトリガーの真横（180度）に開くため、ツールチップを上に出すと
  // 斜め上の項目と重なる。この項目だけ左に出す。
  it('最初の項目のツールチップだけ左に出す', async () => {
    const component = await mountSuspended(AppFab)
    const tooltips = component.findAll('.tooltip')

    expect(tooltips[0]?.classes()).toContain('tooltip-left')
    for (const tooltip of tooltips.slice(1)) {
      expect(tooltip.classes()).not.toContain('tooltip-left')
    }
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

    expect(component.find('.fab').classes()).toContain('fab-flower')
    expect(component.find('div').classes()).toContain('sm:hidden')
  })

  // FABはfixedで浮くため、それ自身では場所を取らない。ページ末尾のコンテンツや
  // フッター右下の導線が隠れないよう、流し込みの余白を自前で確保する。
  it('スマホ幅でFABが収まる高さぶんの余白を確保する', async () => {
    const component = await mountSuspended(AppFab)
    // アイコンのSVGも aria-hidden を持つため、div に限定して余白だけを引く。
    const spacer = component.find('div[aria-hidden="true"]')

    expect(spacer.classes()).toContain(
      'h-[calc(4rem+env(safe-area-inset-bottom))]',
    )
  })
})
