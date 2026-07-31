import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppHeader from '../../../app/components/AppHeader.vue'
import { mainNavItems } from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

describe('AppHeader', () => {
  it('サイト名からトップページへ戻れる', async () => {
    const component = await mountSuspended(AppHeader)
    const home = component.find('a[href="/"]')

    expect(home.exists()).toBe(true)
    expect(home.text()).toContain('FargoRate FairMatch')
    expect(home.find('svg').exists()).toBe(true)
  })

  /**
   * ナビゲーションの有無はセッションではなくレイアウトの都合で決まる。
   * `/` は認証済みでも紹介ページのままなので、既定では出さない。
   */
  it('既定ではナビゲーションを出さない', async () => {
    const component = await mountSuspended(AppHeader)

    expect(component.find('nav').exists()).toBe(false)
  })

  it('show-nav を付けると主要ナビゲーションを出す', async () => {
    const component = await mountSuspended(AppHeader, {
      props: { showNav: true },
    })
    const links = component.findAll('nav a')

    expect(links.map((link) => link.text())).toEqual(
      mainNavItems.map((item) => jaMessage(item.labelKey)),
    )
    expect(links.map((link) => link.attributes('href'))).toEqual(
      mainNavItems.map((item) => item.to),
    )
  })

  // ドックはスマホ幅で下部に固定されるため、デスクトップ幅のナビゲーションと
  // 出し分ける。片方だけが常時見えると同じ項目が二重に並ぶ。
  it('ナビゲーションはスマホ幅では隠す', async () => {
    const component = await mountSuspended(AppHeader, {
      props: { showNav: true },
    })

    expect(component.find('nav').classes()).toContain('hidden')
    expect(component.find('nav').classes()).toContain('sm:flex')
  })
})
