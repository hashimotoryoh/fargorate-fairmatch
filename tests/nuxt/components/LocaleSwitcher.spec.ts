import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LocaleSwitcher from '../../../app/components/LocaleSwitcher.vue'

// mockNuxtImport のファクトリはファイル先頭へ巻き上げられるため、
// 差し替える関数も同じタイミングで用意する必要がある。
const navigateTo = vi.hoisted(() => vi.fn())

mockNuxtImport('navigateTo', () => navigateTo)

/** `useI18n()` は setup の中でしか呼べないため、テストからは Nuxt 経由で引く。 */
function i18n() {
  return useNuxtApp().$i18n
}

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    navigateTo.mockClear()
  })

  /**
   * 言語を増やす作業を設定と翻訳ファイルの追加だけで終わらせたいため、
   * 選択肢をコンポーネントに書かず `i18n.locales` から作っている。
   */
  it('設定した全てのロケールを選択肢に並べる', async () => {
    const component = await mountSuspended(LocaleSwitcher)

    expect(component.findAll('option').map((option) => option.text())).toEqual(
      i18n().locales.value.map((item) => item.name),
    )
  })

  it('現在のロケールを選択した状態にする', async () => {
    const component = await mountSuspended(LocaleSwitcher)

    expect(component.find<HTMLSelectElement>('select').element.value).toBe(
      i18n().locale.value,
    )
  })

  // 表示名は各言語の自称表記のままにする。翻訳すると、読めない言語に
  // 切り替えてしまった人が元の言語を見つけられなくなる。
  it('選択肢の表示名を翻訳しない', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const labels = component.findAll('option').map((option) => option.text())

    expect(labels).toContain('日本語')
    expect(labels).toContain('English')
  })

  // 切り替え先は今いるページに対応する別ロケールのURLでなければならない。
  // トップページへ戻してしまうと、読んでいた内容を見失う。
  it('選ぶと同じページの別ロケールのURLへ移る', async () => {
    const component = await mountSuspended(LocaleSwitcher)

    await component.find('select').setValue('en')
    await flushPromises()

    expect(navigateTo).toHaveBeenCalledWith('/en')
  })

  // 読み上げ環境ではラベルの無いセレクトボックスが何の選択なのか分からない。
  it('読み上げ用のラベルを持つ', async () => {
    const component = await mountSuspended(LocaleSwitcher)

    expect(component.find('select').attributes('aria-label')).not.toBe('')
  })
})
