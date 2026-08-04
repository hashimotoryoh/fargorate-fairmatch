import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GameHeader from '../../../app/components/GameHeader.vue'

describe('GameHeader', () => {
  // ゲーム中の誤タップで対局から離脱しないようにする。
  it('中央のタイトルをリンクにしない', async () => {
    const component = await mountSuspended(GameHeader)

    expect(component.text()).toContain('FargoRate FairRace')
    expect(component.find('a').exists()).toBe(false)
  })

  // 左右のスロットが空でも中央がずれない構造を、グリッドの列指定で保つ。
  it('左右のスロットが空でも3カラムのグリッドを保つ', async () => {
    const component = await mountSuspended(GameHeader)

    expect(component.find('header').classes()).toContain(
      'grid-cols-[1fr_auto_1fr]',
    )
  })

  it('左右のスロットの内容を描画する', async () => {
    const component = await mountSuspended(GameHeader, {
      slots: {
        leading: () => 'LEADING',
        actions: () => 'ACTIONS',
      },
    })

    expect(component.text()).toContain('LEADING')
    expect(component.text()).toContain('ACTIONS')
  })
})
