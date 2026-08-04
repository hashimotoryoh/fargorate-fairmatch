import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import OpponentSelector from '../../../app/components/OpponentSelector.vue'
import { jaMessage } from '../../helpers/i18n'
import { createFargoRatePlayer } from '../../helpers/fixtures'

const { lookupHandler } = vi.hoisted(() => ({ lookupHandler: vi.fn() }))

mockNuxtImport('useUserSession', () => () => ({
  loggedIn: ref(true),
  user: ref(createFargoRatePlayer({ name: 'Ryoh Hashimoto' })),
}))

registerEndpoint('/api/players/lookup', {
  method: 'POST',
  handler: lookupHandler,
})

const RESULTS = [
  {
    name: 'Kengo Sato',
    readableId: '1111111',
    membershipId: '9900001111111',
    location: 'Japan - Tokyo',
    rating: 419,
    robustness: 288,
  },
  {
    name: 'Kengo Sato',
    readableId: '2222222',
    membershipId: null,
    location: null,
    rating: 402,
    robustness: 96,
  },
]

// マウントしたまま次のテストで clearNuxtState() すると、残ったインスタンスの
// 再レンダーが undefined になった状態を読んで落ちる。テストごとに必ず
// アンマウントする。
let wrapper: VueWrapper | undefined

async function mountSelector() {
  wrapper = await mountSuspended(OpponentSelector)
  return wrapper
}

async function searchFor(component: VueWrapper, query: string) {
  await component.find('input[type="text"]').setValue(query)
  await component.find('form').trigger('submit')
  await flushPromises()
}

describe('OpponentSelector', () => {
  beforeEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllMocks()
    localStorage.clear()
    clearNuxtState()
    lookupHandler.mockReturnValue(RESULTS)
  })

  it('見出しとリードで、誰の対戦相手を選ぶのかを明示する', async () => {
    const component = await mountSelector()

    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.heading'),
    )
    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.lead', { name: 'Ryoh Hashimoto' }),
    )
  })

  it('タブは「FargoRateで探す」と「ゲスト」の2つだけを出す', async () => {
    const component = await mountSelector()
    const tabs = component.findAll('[role="tab"]')

    expect(tabs.map((tab) => tab.text())).toEqual([
      jaMessage('games.briefing.opponent.methodSearch'),
      jaMessage('games.briefing.opponent.methodGuest'),
    ])
  })

  it('名前で検索した候補から選ぶと、対戦相手として確定する', async () => {
    const component = await mountSelector()
    await searchFor(component, 'Kengo Sato')

    const card = component
      .findAll('button')
      .find((button) => button.text().includes('Japan - Tokyo'))
    await card?.trigger('click')

    expect(component.emitted('select')?.[0]?.[0]).toMatchObject({
      kind: 'fargorate',
      name: 'Kengo Sato',
      membershipId: '9900001111111',
      readableId: '1111111',
      rating: 419,
    })
  })

  // 最近の対戦相手への保存と、レーティングの引き直しの鍵が無い。
  it('membershipIdが無い候補は選べない', async () => {
    const component = await mountSelector()
    await searchFor(component, 'Kengo Sato')

    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.noId'),
    )

    const disabled = component
      .findAll('button[disabled]')
      .find((button) => button.text().includes('402'))
    expect(disabled).toBeDefined()
  })

  it('該当が無ければその旨を出す', async () => {
    lookupHandler.mockReturnValue([])

    const component = await mountSelector()
    await searchFor(component, 'Nobody Here')

    expect(component.text()).toContain(jaMessage('lookup.empty'))
  })

  it('最近の対戦相手を選ぶと、検索を経ずに確定する', async () => {
    const stored = createFargoRatePlayer({ name: 'Alex Morgan', rating: 612 })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountSelector()
    const button = component
      .findAll('button')
      .find((candidate) => candidate.text().includes('Alex Morgan'))
    await button?.trigger('click')

    expect(lookupHandler).not.toHaveBeenCalled()
    expect(component.emitted('select')?.[0]?.[0]).toEqual(stored)
  })

  // 個別削除は /games 側にのみ置き、ここは選択に専念させる。
  it('最近の対戦相手に削除ボタンを置かない', async () => {
    localStorage.setItem(
      'fairrace:recentOpponents',
      JSON.stringify([createFargoRatePlayer({ name: 'Alex Morgan' })]),
    )

    const component = await mountSelector()

    const suffix = jaMessage('games.recentOpponents.remove', {
      name: 'Alex Morgan',
    })
    const removeButton = component
      .findAll('button')
      .find((button) => button.attributes('aria-label') === suffix)
    expect(removeButton).toBeUndefined()
  })

  it('ゲストタブから自己申告の相手を確定できる', async () => {
    const component = await mountSelector()
    await component.findAll('[role="tab"]')[1]?.trigger('click')

    await component.find('input[type="text"]').setValue('Guest Taro')
    await component.find('input[type="number"]').setValue('450')
    await component.find('form').trigger('submit')

    expect(component.emitted('select')?.[0]?.[0]).toEqual({
      kind: 'guest',
      name: 'Guest Taro',
      rating: 450,
    })
  })

  it('ゲストの入力の不備はその場で知らせ、確定しない', async () => {
    const component = await mountSelector()
    await component.findAll('[role="tab"]')[1]?.trigger('click')

    await component.find('input[type="number"]').setValue('10000')
    await component.find('form').trigger('submit')
    await flushPromises()

    expect(component.emitted('select')).toBeUndefined()
    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('guest.errors.invalidRating', { min: '-90', max: '930' }),
    )
  })
})
