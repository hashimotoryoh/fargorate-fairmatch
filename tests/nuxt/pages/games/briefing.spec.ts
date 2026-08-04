import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { clearNuxtState, useNuxtApp } from '#imports'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import BriefingPage from '../../../../app/pages/games/briefing.vue'
import { jaMessage } from '../../../helpers/i18n'
import { createFargoRatePlayer } from '../../../helpers/fixtures'

const { routeQuery, navigateToMock, lookupHandler } = vi.hoisted(() => ({
  routeQuery: {} as Record<string, unknown>,
  navigateToMock: vi.fn(),
  lookupHandler: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  loggedIn: ref(true),
  user: ref(createFargoRatePlayer({ name: 'Ryoh Hashimoto' })),
}))

registerEndpoint('/api/players/lookup', {
  method: 'POST',
  handler: lookupHandler,
})

function setGameSetup(setup: Record<string, unknown>) {
  sessionStorage.setItem('fairrace:gameSetup', JSON.stringify(setup))
}

function stepLabels(component: VueWrapper) {
  return component.findAll('.step')
}

// 前のテストのインスタンスが残ると、その watchEffect が状態の復元に反応して
// 遷移してしまう。テストごとに必ずアンマウントする。
let wrapper: VueWrapper | undefined

async function mountPage() {
  wrapper = await mountSuspended(BriefingPage)
  return wrapper
}

describe('ブリーフィングページ', () => {
  beforeEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    clearNuxtState()
    routeQuery.game = undefined
    routeQuery.change = undefined
    lookupHandler.mockReturnValue([])
  })

  it('並びは常にゲーム・対戦プレイヤー・ゲーム設定の順で出す', async () => {
    const component = await mountPage()

    expect(stepLabels(component).map((step) => step.text())).toEqual([
      jaMessage('games.briefing.steps.game'),
      jaMessage('games.briefing.steps.opponent'),
      jaMessage('games.briefing.steps.setup'),
    ])
  })

  it('何も決まっていなければゲームの選択から始まる', async () => {
    const component = await mountPage()
    await flushPromises()

    expect(component.text()).toContain(jaMessage('games.briefing.game.heading'))
  })

  it('?game= を受け取るとゲームに完了印を付け、対戦プレイヤーの選択から始まる', async () => {
    routeQuery.game = 'fair-single-race'

    const component = await mountPage()
    await flushPromises()

    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.heading'),
    )
    expect(stepLabels(component)[0]?.classes()).toContain('step-primary')
  })

  // リロードのたびにクエリが再適用され、選択が巻き戻るのを防ぐ。
  it('クエリは読み取ったあとURLから落とす', async () => {
    routeQuery.game = 'fair-single-race'
    const replaceSpy = vi.spyOn(useNuxtApp().$router, 'replace')

    await mountPage()
    await flushPromises()

    expect(replaceSpy).toHaveBeenCalledWith({ query: {} })
  })

  it('準備中のゲームのスラッグは受け取っても無視する', async () => {
    routeQuery.game = 'usapl-9-ball'

    const component = await mountPage()
    await flushPromises()

    expect(component.text()).toContain(jaMessage('games.briefing.game.heading'))
  })

  it('対戦相手が決まっていればゲームの選択から始まり、対戦プレイヤーに完了印を付ける', async () => {
    setGameSetup({ slug: null, opponent: createFargoRatePlayer() })

    const component = await mountPage()
    await flushPromises()

    expect(component.text()).toContain(jaMessage('games.briefing.game.heading'))
    expect(stepLabels(component)[1]?.classes()).toContain('step-primary')
  })

  it('ゲームと対戦相手が揃うと、ゲームのブリーフィングへ進む', async () => {
    setGameSetup({
      slug: 'fair-single-race',
      opponent: createFargoRatePlayer(),
    })

    await mountPage()
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith(
      '/games/fair-single-race/briefing',
    )
  })

  // ステップ3の「プレイヤー変更」からは ?change=opponent で戻ってくる。
  it('?change=opponent なら揃っていても対戦プレイヤーの選び直しを出す', async () => {
    routeQuery.change = 'opponent'
    setGameSetup({
      slug: 'fair-single-race',
      opponent: createFargoRatePlayer(),
    })

    const component = await mountPage()
    await flushPromises()

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.heading'),
    )
  })

  it('完了印のステップをタップすると選び直しに戻れる', async () => {
    routeQuery.game = 'fair-single-race'

    const component = await mountPage()
    await flushPromises()

    await stepLabels(component)[0]?.find('button').trigger('click')

    expect(component.text()).toContain(jaMessage('games.briefing.game.heading'))
  })

  it('ゲームを選ぶと対戦プレイヤーの選択へ進む', async () => {
    const component = await mountPage()
    await flushPromises()

    const card = component
      .findAll('button')
      .find((button) =>
        button.text().includes(jaMessage('games.types.fairSingleRace.label')),
      )
    await card?.trigger('click')

    expect(component.text()).toContain(
      jaMessage('games.briefing.opponent.heading'),
    )
    expect(
      JSON.parse(sessionStorage.getItem('fairrace:gameSetup') ?? '{}').slug,
    ).toBe('fair-single-race')
  })

  it('検索した候補を選ぶと最近の対戦相手に記憶し、ゲーム設定へ進む', async () => {
    routeQuery.game = 'fair-single-race'
    lookupHandler.mockReturnValue([
      {
        name: 'Kengo Sato',
        readableId: '1111111',
        membershipId: '9900001111111',
        location: 'Japan - Tokyo',
        rating: 419,
        robustness: 288,
      },
    ])

    const component = await mountPage()
    await flushPromises()

    await component.find('input[type="text"]').setValue('Kengo Sato')
    await component.find('main form').trigger('submit')
    await flushPromises()

    await vi.waitFor(() => expect(component.text()).toContain('Japan - Tokyo'))
    const card = component
      .findAll('button')
      .find((button) => button.text().includes('Japan - Tokyo'))
    await card?.trigger('click')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith(
        '/games/fair-single-race/briefing',
      ),
    )

    expect(
      JSON.parse(localStorage.getItem('fairrace:recentOpponents') ?? '[]')[0],
    ).toMatchObject({ membershipId: '9900001111111' })
  })

  // ゲストは引き直しの鍵を持たないため、最近の対戦相手には残さない。
  it('ゲストの相手を確定しても最近の対戦相手には残さない', async () => {
    routeQuery.game = 'fair-single-race'

    const component = await mountPage()
    await flushPromises()

    await component.findAll('[role="tab"]')[1]?.trigger('click')
    await component.find('input[type="number"]').setValue('450')
    await component.find('main form').trigger('submit')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith(
        '/games/fair-single-race/briefing',
      ),
    )

    expect(localStorage.getItem('fairrace:recentOpponents')).toBeNull()
  })
})
