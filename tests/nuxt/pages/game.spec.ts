import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import GamePage from '../../../app/pages/game.vue'

describe('ゲームページ', () => {
  it('9ボールと8ボールを説明つきで選ばせる', async () => {
    const component = await mountSuspended(GamePage)
    const labels = component.findAll('fieldset label')

    expect(labels).toHaveLength(2)
    expect(labels[0]?.text()).toContain('9ボール')
    expect(labels[0]?.text()).toContain('9番を先に落とした方が取得する')
    expect(labels[1]?.text()).toContain('8ボール')
    expect(labels[1]?.text()).toContain('8番を落とした方が取得する')
  })

  it('種目を同じ名前のラジオボタンとして排他にする', async () => {
    const component = await mountSuspended(GamePage)
    const radios = component.findAll('input[type="radio"]')

    expect(radios.map((radio) => radio.attributes('name'))).toEqual([
      'gameType',
      'gameType',
    ])
    expect(radios.map((radio) => radio.attributes('value'))).toEqual([
      '9ball',
      '8ball',
    ])
  })

  it('既定ではどの種目も選ばれていない', async () => {
    const component = await mountSuspended(GamePage)

    expect(component.find('.border-primary').exists()).toBe(false)
  })

  it('選んだ種目のカードだけを強調する', async () => {
    const component = await mountSuspended(GamePage)

    await component.findAll('input[type="radio"]')[1]?.setValue()

    const labels = component.findAll('fieldset label')
    expect(labels[0]?.classes()).not.toContain('border-primary')
    expect(labels[1]?.classes()).toContain('border-primary')
  })

  // 選択後のスコア入力画面は未実装のため、開始はまだ行えない。
  it('開始ボタンは準備中として無効にする', async () => {
    const component = await mountSuspended(GamePage)
    const button = component.find('button')

    expect(button.text()).toContain('準備中')
    expect(button.attributes('disabled')).toBeDefined()
  })
})
