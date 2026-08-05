import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Icon } from '#components'
import { describe, expect, it } from 'vitest'
import AppHeader from '../../../app/components/AppHeader.vue'
import LocaleSwitcher from '../../../app/components/LocaleSwitcher.vue'
import ThemeSwitcher from '../../../app/components/ThemeSwitcher.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

describe('AppHeader', () => {
  it('サイト名からトップページへ戻れる', async () => {
    const component = await mountSuspended(AppHeader)
    const home = component.find('a[href="/"]')

    expect(home.exists()).toBe(true)
    expect(home.text()).toContain('FargoRate FairRace')
    expect(home.findComponent(Icon).props('name')).toBe('custom:app-logo')
  })

  /**
   * ナビゲーションの有無はセッションではなくレイアウトの都合で決まる。
   * `/` は認証済みでも紹介ページのままなので、既定では出さない。
   */
  it('既定ではナビゲーションを出さない', async () => {
    const component = await mountSuspended(AppHeader)

    expect(component.find('nav').exists()).toBe(false)
  })

  // 言語の切り替えはどのページからも要る。ナビゲーションを出さない公開ページ
  // でも消えないことを固定する。
  it('ナビゲーションの有無によらず言語の切り替えを出す', async () => {
    for (const showNav of [false, true]) {
      const component = await mountSuspended(AppHeader, { props: { showNav } })

      expect(component.findComponent(LocaleSwitcher).exists()).toBe(true)
    }
  })

  // テーマの切り替えも言語と同様、どのページからも要る。
  it('ナビゲーションの有無によらずテーマの切り替えを出す', async () => {
    for (const showNav of [false, true]) {
      const component = await mountSuspended(AppHeader, { props: { showNav } })

      expect(component.findComponent(ThemeSwitcher).exists()).toBe(true)
    }
  })

  /**
   * プレイヤー検索は認証の要らない機能で、ヘッダーのこのボタンとフッターだけが
   * 導線になる。アイコンだけのボタンなので、名称はツールチップと読み上げ用
   * ラベルで補う。
   */
  it('ナビゲーションの有無によらずプレイヤー検索への導線を出す', async () => {
    for (const showNav of [false, true]) {
      const component = await mountSuspended(AppHeader, { props: { showNav } })
      const lookup = component.find('a[href="/lookup"]')

      expect(lookup.attributes('aria-label')).toBe(jaMessage('nav.lookup'))
      expect(lookup.findComponent(Icon).props('name')).toBe('heroicons:users')
      expect(component.find('.tooltip').attributes('data-tip')).toBe(
        jaMessage('nav.lookup'),
      )
    }
  })

  it('show-nav を付けると主要ナビゲーションをタブで出す', async () => {
    const component = await mountSuspended(AppHeader, {
      props: { showNav: true },
    })
    const tablist = component.find('nav [role="tablist"]')
    const tabs = component.findAll('nav a')

    expect(tablist.classes()).toContain('tabs')
    expect(tablist.classes()).toContain('tabs-border')
    expect(tabs.map((tab) => tab.text())).toEqual(
      mainNavItems.map((item) => jaMessage(item.labelKey)),
    )
    expect(tabs.map((tab) => tab.attributes('href'))).toEqual(
      mainNavItems.map((item) => item.to),
    )
    expect(tabs.map((tab) => tab.findComponent(Icon).props('name'))).toEqual(
      mainNavItems.map((item) => item.icon),
    )
  })

  // FABはスマホ幅で右下に固定されるため、デスクトップ幅のナビゲーションと
  // 出し分ける。片方だけが常時見えると同じ項目が二重に並ぶ。
  it('ナビゲーションはスマホ幅では隠す', async () => {
    const component = await mountSuspended(AppHeader, {
      props: { showNav: true },
    })

    expect(component.find('nav').classes()).toContain('hidden')
    expect(component.find('nav').classes()).toContain('sm:flex')
  })
})
