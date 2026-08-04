import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { createError, readBody } from 'h3'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import FairSingleRaceBriefingPage from '../../../../../app/pages/games/fair-single-race/briefing.vue'
import { jaMessage } from '../../../../helpers/i18n'
import { createFargoRatePlayer } from '../../../../helpers/fixtures'

const {
  navigateToMock,
  refreshSessionMock,
  refreshHandler,
  lookupHandler,
  racesHandler,
} = vi.hoisted(() => ({
  navigateToMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  refreshHandler: vi.fn(),
  lookupHandler: vi.fn(),
  racesHandler: vi.fn(),
}))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  loggedIn: ref(true),
  user: ref(createFargoRatePlayer({ name: 'Ryoh Hashimoto', rating: 576 })),
  fetch: refreshSessionMock,
}))

registerEndpoint('/api/auth/refresh', {
  method: 'POST',
  handler: refreshHandler,
})
registerEndpoint('/api/players/lookup', {
  method: 'POST',
  handler: lookupHandler,
})
registerEndpoint('/api/races', { method: 'GET', handler: racesHandler })

const OPPONENT = createFargoRatePlayer({
  name: 'Kengo Sato',
  membershipId: '9900001111111',
  readableId: '1111111',
  rating: 419,
  robustness: 288,
})

const RACE_OPTIONS = [
  { playerRaceTo: 3, opponentRaceTo: 2, recommended: false },
  { playerRaceTo: 12, opponentRaceTo: 5, recommended: true },
  { playerRaceTo: 13, opponentRaceTo: 6, recommended: false },
]

function setGameSetup(setup: Record<string, unknown>) {
  sessionStorage.setItem('fairrace:gameSetup', JSON.stringify(setup))
}

// 前のテストのインスタンスが残ると、その watchEffect が状態の復元に反応して
// 遷移してしまう。テストごとに必ずアンマウントする。
let wrapper: VueWrapper | undefined

async function mountPage() {
  wrapper = await mountSuspended(FairSingleRaceBriefingPage)
  return wrapper
}

async function mountPrepared() {
  const component = await mountPage()
  await vi.waitFor(() =>
    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.briefing.heading'),
    ),
  )
  return component
}

describe('フェアセットマッチのブリーフィングページ', () => {
  beforeEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    clearNuxtState()
    setGameSetup({ slug: 'fair-single-race', opponent: OPPONENT })
    refreshHandler.mockReturnValue(
      createFargoRatePlayer({ name: 'Ryoh Hashimoto', rating: 576 }),
    )
    lookupHandler.mockReturnValue([{ ...OPPONENT }])
    racesHandler.mockReturnValue(RACE_OPTIONS)
  })

  it('ゲームか対戦相手が無ければステップ1・2へ送り返す', async () => {
    sessionStorage.clear()

    await mountPage()
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith('/games/briefing'),
    )
  })

  it('3つのステップを出し、ゲーム設定を現在地にする', async () => {
    const component = await mountPrepared()

    const steps = component.findAll('.step')
    expect(steps).toHaveLength(3)
    expect(steps[2]?.classes()).toContain('step-primary')
  })

  // 完了済みのステップからルートをまたいで選び直しに戻れる。
  it('ゲームのステップをタップすると選び直しに戻る', async () => {
    const component = await mountPrepared()

    await component
      .findAll('.step button')
      .find((button) =>
        button.text().includes(jaMessage('games.briefing.steps.game')),
      )
      ?.trigger('click')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith(
        '/games/briefing?change=game',
      ),
    )
  })

  it('ヘッダーの中央に「ゲームを開始する」を出す', async () => {
    const component = await mountPrepared()

    expect(component.find('header').text()).toContain(
      jaMessage('games.briefing.heading'),
    )
  })

  it('両者を所在地つきのプレイヤーカードで見せる', async () => {
    const component = await mountPrepared()

    expect(component.text()).toContain('Ryoh Hashimoto')
    expect(component.text()).toContain('Kengo Sato')
    expect(component.text()).toContain('Tokyo')
    expect(component.findAll('.stat').length).toBeGreaterThanOrEqual(4)
  })

  // ブリーフィングの中断は選択を丸ごと破棄し、入る前のページへ戻す。
  it('終了を確定すると選択を破棄して、入る前のページへ戻る', async () => {
    const component = await mountPrepared()

    await component
      .find('header')
      .findAll('button')
      .find((button) => button.text() === jaMessage('games.header.exit'))
      ?.trigger('click')
    await component
      .findAll('button')
      .find((button) => button.text() === jaMessage('games.header.confirm'))
      ?.trigger('click')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith('/games'),
    )

    expect(sessionStorage.getItem('fairrace:gameSetup')).toBeNull()
  })

  it('入るときに自分と相手のレーティングを引き直す', async () => {
    await mountPrepared()

    expect(refreshHandler).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(lookupHandler).toHaveBeenCalledTimes(1)
  })

  // readableId は1件に絞れる検索キーとして優先する。
  it('相手の引き直しは readableId を検索語に使う', async () => {
    lookupHandler.mockImplementation(async (event) => {
      const body = await readBody(event)
      expect(body.query).toBe(OPPONENT.readableId)
      return [{ ...OPPONENT, rating: 425 }]
    })

    const component = await mountPrepared()

    expect(component.text()).toContain('425')
  })

  // 検索キーはどうであれ、採用するのは membershipId が一致した候補だけ。
  it('membershipId が一致しない候補は相手として採用しない', async () => {
    lookupHandler.mockReturnValue([
      { ...OPPONENT, membershipId: '9900009999999', rating: 700 },
    ])

    const component = await mountPrepared()

    expect(component.text()).not.toContain('700')
    expect(component.text()).toContain('419')
  })

  it('引き直しに失敗しても既存の値で続行する', async () => {
    refreshHandler.mockImplementation(() => {
      throw createError({ statusCode: 502 })
    })
    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 502 })
    })

    const component = await mountPrepared()

    expect(component.text()).toContain('576')
    expect(component.text()).toContain('419')
  })

  it('おすすめの候補だけを大きく出し、選択済みにする', async () => {
    const component = await mountPrepared()

    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.briefing.recommended'),
    )
    expect(component.text()).toContain('12')
    expect(component.text()).toContain('5')
    expect(component.find('[role="radiogroup"]').exists()).toBe(false)
  })

  it('他の候補を開いて選び直すと、選択が置き換わり一覧が閉じる', async () => {
    const component = await mountPrepared()

    await component
      .findAll('button')
      .find((button) =>
        button.text().includes(
          jaMessage('games.fairSingleRace.briefing.otherRaces', {
            count: '2',
          }),
        ),
      )
      ?.trigger('click')

    const option = component
      .findAll('[role="radio"]')
      .find((radio) => radio.text().includes('3 - 2'))
    await option?.trigger('click')

    expect(component.find('[role="radiogroup"]').exists()).toBe(false)
    expect(component.text()).toContain('3')
  })

  it('候補を取得できなければ再試行を出す', async () => {
    racesHandler.mockImplementation(() => {
      throw createError({ statusCode: 502 })
    })

    const component = await mountPage()
    await vi.waitFor(() =>
      expect(component.text()).toContain(
        jaMessage('games.fairSingleRace.briefing.racesUnavailable'),
      ),
    )

    racesHandler.mockReturnValue(RACE_OPTIONS)
    await component
      .findAll('button')
      .find((button) =>
        button
          .text()
          .includes(jaMessage('games.fairSingleRace.briefing.retry')),
      )
      ?.trigger('click')
    await flushPromises()

    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.briefing.recommended'),
    )
  })

  it('候補が0件でも再試行を出す', async () => {
    racesHandler.mockReturnValue([])

    const component = await mountPage()
    await vi.waitFor(() =>
      expect(component.text()).toContain(
        jaMessage('games.fairSingleRace.briefing.racesUnavailable'),
      ),
    )
  })

  it('プレイ開始でマッチを初期化し、スコアボードへ移る', async () => {
    const component = await mountPrepared()

    await component
      .findAll('button')
      .find((button) =>
        button.text().includes(jaMessage('games.fairSingleRace.briefing.play')),
      )
      ?.trigger('click')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith(
        '/games/fair-single-race/scoreboard',
      ),
    )

    expect(
      JSON.parse(
        sessionStorage.getItem('fairrace:match:fair-single-race') ?? '{}',
      ),
    ).toMatchObject({ playerRaceTo: 12, opponentRaceTo: 5, history: [] })
  })

  it('プレイヤー変更で選び直しに戻る', async () => {
    const component = await mountPrepared()

    await component
      .findAll('button')
      .find((button) =>
        button
          .text()
          .includes(jaMessage('games.fairSingleRace.briefing.changePlayer')),
      )
      ?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith(
      '/games/briefing?change=opponent',
    )
  })
})
