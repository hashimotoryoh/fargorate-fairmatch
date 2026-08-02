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
})
