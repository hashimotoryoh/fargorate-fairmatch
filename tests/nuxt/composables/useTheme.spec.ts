import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useTheme } from '../../../app/composables/useTheme'

// `useCookie` はNuxtのコンテキストを要するため、コンポーネントにマウントして
// 呼び出す。
const TestComponent = defineComponent({
  template: '<div />',
  setup() {
    return { theme: useTheme() }
  },
})

describe('useTheme', () => {
  // `useCookie` は path=/ でクッキーを書くため、テストの後始末も同じ path を
  // 指定しないと別のクッキーとして残り、次のテストに値が漏れる。
  afterEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('クッキーが無い間は既定でダークテーマを返す', async () => {
    const component = await mountSuspended(TestComponent)

    expect(component.vm.theme).toBe('dark')
  })

  it('値を変えるとクッキーへ保存する', async () => {
    const component = await mountSuspended(TestComponent)

    component.vm.theme = 'light'
    await component.vm.$nextTick()

    expect(document.cookie).toContain('theme=light')
  })

  describe('不正な値がクッキーに入っている場合', () => {
    beforeEach(() => {
      document.cookie = 'theme=not-a-theme; path=/'
    })

    it('既定のダークテーマとして扱う', async () => {
      const component = await mountSuspended(TestComponent)

      expect(component.vm.theme).toBe('dark')
    })
  })

  // `refresh: true` により、値を変えていない再訪問でもクッキーの保存期間を
  // 延ばせる。useCookie は既定では値が変わらない限り書き直さないため、
  // ここが崩れると再訪問での延長自体が効かなくなる。
  it('値を変えずに代入し直しても保存期間を延ばすため書き直す', async () => {
    document.cookie = 'theme=light; path=/'
    const component = await mountSuspended(TestComponent)

    // ブラウザがクッキーを消す直前の状態を模して、書き直しが実際に起きたか
    // どうかを確かめられるようにする。
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    expect(document.cookie).not.toContain('theme=light')

    const currentTheme = component.vm.theme
    component.vm.theme = currentTheme
    await component.vm.$nextTick()

    expect(document.cookie).toContain('theme=light')
  })
})
