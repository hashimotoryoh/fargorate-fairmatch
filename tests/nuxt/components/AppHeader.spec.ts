import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { Icon } from '#components'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import AppHeader from '../../../app/components/AppHeader.vue'
import LocaleSwitcher from '../../../app/components/LocaleSwitcher.vue'
import ThemeSwitcher from '../../../app/components/ThemeSwitcher.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

// mockNuxtImport のファクトリはファイル先頭へ巻き上げられるため、
// 差し替える状態も同じタイミングで用意する必要がある。
const session = vi.hoisted(() => ({ loggedIn: false }))

mockNuxtImport('useUserSession', () => () => ({
  loggedIn: computed(() => session.loggedIn),
}))

describe('AppHeader', () => {
  beforeEach(() => {
    session.loggedIn = false
  })

  it('サイト名からトップページへ戻れる', async () => {
    const component = await mountSuspended(AppHeader)
    const home = component.find('a[href="/"]')

    expect(home.exists()).toBe(true)
    expect(home.text()).toContain('FargoRate FairRace')
    expect(home.findComponent(Icon).props('name')).toBe('custom:app-logo')
  })

  it('未認証ならナビゲーションを出さない', async () => {
    const component = await mountSuspended(AppHeader)

    expect(component.find('nav').exists()).toBe(false)
  })

  // 言語の切り替えはどのページからも要る。認証の有無で消えないことを固定する。
  it('認証の有無によらず言語の切り替えを出す', async () => {
    for (const loggedIn of [false, true]) {
      session.loggedIn = loggedIn
      const component = await mountSuspended(AppHeader)

      expect(component.findComponent(LocaleSwitcher).exists()).toBe(true)
    }
  })

  // テーマの切り替えも言語と同様、どのページからも要る。
  it('認証の有無によらずテーマの切り替えを出す', async () => {
    for (const loggedIn of [false, true]) {
      session.loggedIn = loggedIn
      const component = await mountSuspended(AppHeader)

      expect(component.findComponent(ThemeSwitcher).exists()).toBe(true)
    }
  })

  /**
   * プレイヤー検索は認証の要らない機能で、ヘッダーのこのボタンとフッターだけが
   * 導線になる。アイコンだけのボタンなので、名称はツールチップと読み上げ用
   * ラベルで補う。
   */
  it('認証の有無によらずプレイヤー検索への導線を出す', async () => {
    for (const loggedIn of [false, true]) {
      session.loggedIn = loggedIn
      const component = await mountSuspended(AppHeader)
      const lookup = component.find('a[href="/lookup"]')

      expect(lookup.attributes('aria-label')).toBe(jaMessage('nav.lookup'))
      expect(lookup.findComponent(Icon).props('name')).toBe('heroicons:users')
      expect(component.find('.tooltip').attributes('data-tip')).toBe(
        jaMessage('nav.lookup'),
      )
    }
  })

  // ナビゲーションはレイアウトによらず認証状態だけで決まる。`/` のような
  // 公開ページでも、認証済みならナビゲーションが出る。
  it('認証済みなら主要ナビゲーションをタブで出す', async () => {
    session.loggedIn = true

    const component = await mountSuspended(AppHeader)
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
    session.loggedIn = true

    const component = await mountSuspended(AppHeader)

    expect(component.find('nav').classes()).toContain('hidden')
    expect(component.find('nav').classes()).toContain('sm:flex')
  })
})
