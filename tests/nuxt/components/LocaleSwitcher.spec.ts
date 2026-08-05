import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { describe, expect, it } from 'vitest'
import LocaleSwitcher from '../../../app/components/LocaleSwitcher.vue'

/** `useI18n()` は setup の中でしか呼べないため、テストからは Nuxt 経由で引く。 */
function i18n() {
  return useNuxtApp().$i18n
}

describe('LocaleSwitcher', () => {
  /**
   * 言語を増やす作業を設定と翻訳ファイルの追加だけで終わらせたいため、
   * 選択肢をコンポーネントに書かず `i18n.locales` から作っている。
   */
  it('設定した全てのロケールを国旗を添えて選択肢に並べる', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const options = component.findAll('.dropdown-content a')

    // 要素間の空白はVueのコンパイル時に除去されるため、国旗と表示名は
    // 連結された1つの文字列として比較する。
    expect(options.map((option) => option.text())).toEqual(
      i18n().locales.value.map((item) => `${item.flag}${item.name}`),
    )
  })

  // 切り替え先は今いるページに対応する別ロケールのURLでなければならない。
  // トップページへ戻してしまうと、読んでいた内容を見失う。
  it('各選択肢が同じページの別ロケールのURLを指す', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const options = component.findAll('.dropdown-content a')

    expect(options.map((option) => option.attributes('href'))).toEqual([
      '/',
      '/en',
    ])
  })

  it('現在のロケールの選択肢に選択中の印を付ける', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const options = component.findAll('.dropdown-content a')

    expect(options[0]?.classes()).toContain('menu-active')
    expect(options[1]?.classes()).not.toContain('menu-active')
  })

  // 表示名は各言語の自称表記のままにする。翻訳すると、読めない言語に
  // 切り替えてしまった人が元の言語を見つけられなくなる。
  it('選択肢の表示名を翻訳しない', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const labels = component
      .findAll('.dropdown-content a')
      .map((option) => option.text())

    expect(labels.some((label) => label.includes('日本語'))).toBe(true)
    expect(labels.some((label) => label.includes('English'))).toBe(true)
  })

  // 読み上げ環境ではアイコンだけのボタンが何の選択なのか分からない。
  it('開閉のトリガーがフォーカス可能で読み上げ用のラベルを持つ', async () => {
    const component = await mountSuspended(LocaleSwitcher)
    const trigger = component.find('[role="button"]')

    expect(trigger.attributes('tabindex')).toBe('0')
    expect(trigger.attributes('aria-label')).toBeTruthy()
  })
})
