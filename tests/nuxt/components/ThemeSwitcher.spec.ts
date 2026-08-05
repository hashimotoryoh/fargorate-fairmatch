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

  // swap-on（ライトテーマ）が太陽、swap-off（ダークテーマ）が月。
  // テーマと逆のアイコンが出ると、押した結果が直感と食い違う。
  it('太陽と月のアイコンをswapで切り替える', async () => {
    const component = await mountSuspended(ThemeSwitcher)
    const icons = component.findAllComponents(Icon)

    expect(component.find('.swap').classes()).toContain('swap-rotate')
    expect(icons.map((icon) => icon.props('name'))).toEqual([
      'heroicons:sun',
      'heroicons:moon',
    ])
    expect(icons[0]?.classes()).toContain('swap-on')
    expect(icons[1]?.classes()).toContain('swap-off')
  })

  it('既定のダークテーマでは押されていない状態にする', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(component.find('button').attributes('aria-pressed')).toBe('false')
    expect(component.find('.swap').classes()).not.toContain('swap-active')
  })

  // クッキーへの保存を確かめる。セッションに入れると未認証ページや
  // サインアウト後にテーマの好みが失われてしまうため、独立したクッキーを使う。
  it('押すとライトテーマとしてクッキーに保存する', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    await component.find('button').trigger('click')

    expect(document.cookie).toContain('theme=light')
    expect(component.find('button').attributes('aria-pressed')).toBe('true')
    expect(component.find('.swap').classes()).toContain('swap-active')
  })

  // 読み上げ環境ではアイコンだけのボタンが何のためのものか分からない。
  // `attributes()` は属性が無いと `undefined` を返すため、空文字との不一致
  // ではなく真偽で検証しないと、属性そのものが無い場合を見逃す。
  it('読み上げ用のラベルを持つ', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(component.find('button').attributes('aria-label')).toBeTruthy()
  })
})
