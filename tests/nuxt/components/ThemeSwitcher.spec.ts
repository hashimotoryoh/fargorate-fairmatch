import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, afterEach } from 'vitest'
import ThemeSwitcher from '../../../app/components/ThemeSwitcher.vue'

describe('ThemeSwitcher', () => {
  // `useCookie` は path=/ でクッキーを書くため、テストの後始末も同じ path を
  // 指定しないと別のクッキーとして残り、次のテストに値が漏れる。
  afterEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('既定のダークテーマではチェックを入れない', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(
      component.find<HTMLInputElement>('input[type="checkbox"]').element
        .checked,
    ).toBe(false)
  })

  // クッキーへの保存を確かめる。セッションに入れると未認証ページや
  // サインアウト後にテーマの好みが失われてしまうため、独立したクッキーを使う。
  it('切り替えるとライトテーマとしてクッキーに保存する', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    await component.find('input[type="checkbox"]').setValue(true)

    expect(document.cookie).toContain('theme=light')
  })

  // 読み上げ環境ではアイコンだけのボタンが何のためのものか分からない。
  it('読み上げ用のラベルを持つ', async () => {
    const component = await mountSuspended(ThemeSwitcher)

    expect(
      component.find('input[type="checkbox"]').attributes('aria-label'),
    ).not.toBe('')
  })
})
