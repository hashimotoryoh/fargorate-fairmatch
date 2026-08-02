import { mountSuspended } from '@nuxt/test-utils/runtime'
import { Icon } from '#components'
import { describe, expect, it, afterEach } from 'vitest'
import ThemeSwitcher from '../../../app/components/ThemeSwitcher.vue'

describe('ThemeSwitcher', () => {
  // `useCookie` は path=/ でクッキーを書くため、テストの後始末も同じ path を
  // 指定しないと別のクッキーとして残り、次のテストに値が漏れる。
  afterEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('Material Design Iconsのアイコンを描く', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(component.findComponent(Icon).props('name')).toBe(
      'mdi:theme-light-dark',
    )
  })

  it('既定のダークテーマでは押されていない状態にする', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(component.find('button').attributes('aria-pressed')).toBe('false')
  })

  // クッキーへの保存を確かめる。セッションに入れると未認証ページや
  // サインアウト後にテーマの好みが失われてしまうため、独立したクッキーを使う。
  it('押すとライトテーマとしてクッキーに保存する', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    await component.find('button').trigger('click')

    expect(document.cookie).toContain('theme=light')
    expect(component.find('button').attributes('aria-pressed')).toBe('true')
  })

  // 読み上げ環境ではアイコンだけのボタンが何のためのものか分からない。
  it('読み上げ用のラベルを持つ', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(component.find('button').attributes('aria-label')).not.toBe('')
  })
})
