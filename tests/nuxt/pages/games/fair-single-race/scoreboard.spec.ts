import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import ScoreboardPage from '../../../../../app/pages/games/fair-single-race/scoreboard.vue'
import { jaMessage } from '../../../../helpers/i18n'
import { createFargoRatePlayer } from '../../../../helpers/fixtures'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))

mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  loggedIn: ref(true),
  user: ref(createFargoRatePlayer({ name: 'Ryoh Hashimoto', rating: 576 })),
}))

const OPPONENT = createFargoRatePlayer({
  name: 'Kengo Sato',
  membershipId: '9900001111111',
  rating: 419,
  robustness: 288,
})

function seedMatch(history: (0 | 1)[] = []) {
  sessionStorage.setItem(
    'fairrace:gameSetup',
    JSON.stringify({ slug: 'fair-single-race', opponent: OPPONENT }),
  )
  sessionStorage.setItem(
    'fairrace:match:fair-single-race',
    JSON.stringify({
      playerRaceTo: 3,
      opponentRaceTo: 2,
      history,
      startedAt: Date.now(),
    }),
  )
}

// 前のテストのインスタンスが残ると、その watchEffect が状態の復元に反応して
// 遷移してしまう。テストごとに必ずアンマウントする。
let wrapper: VueWrapper | undefined

async function mountPage() {
  wrapper = await mountSuspended(ScoreboardPage)
  return wrapper
}

function increaseButton(component: VueWrapper, name: string) {
  return component
    .findAll('button')
    .find(
      (button) =>
        button.attributes('aria-label') ===
        jaMessage('games.fairSingleRace.scoreboard.increase', { name }),
    )
}

function decreaseButton(component: VueWrapper, name: string) {
  return component
    .findAll('button')
    .find(
      (button) =>
        button.attributes('aria-label') ===
        jaMessage('games.fairSingleRace.scoreboard.decrease', { name }),
    )
}

function scores(component: VueWrapper) {
  return component.findAll('[aria-live="polite"]').map((node) => node.text())
}

describe('フェアセットマッチのスコアボードページ', () => {
  beforeEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllMocks()
    sessionStorage.clear()
    localStorage.clear()
    clearNuxtState()
    seedMatch()
  })

  it('進行中のマッチが無ければステップ1・2へ送り返す', async () => {
    sessionStorage.removeItem('fairrace:match:fair-single-race')

    await mountPage()
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith('/games/briefing'),
    )
  })

  it('両者の名前と必要セット数を出す', async () => {
    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    expect(component.text()).toContain('Ryoh Hashimoto')
    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.scoreboard.raceTo'),
    )
  })

  // +1は右2/3・取り消しは左1/3。取り消しは押す機会が少ないため面積を偏らせる。
  it('+1のタップ領域を取り消しより広く取る', async () => {
    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    const increase = increaseButton(component, 'Ryoh Hashimoto')
    const decrease = decreaseButton(component, 'Ryoh Hashimoto')

    expect(increase?.classes()).toContain('w-2/3')
    expect(decrease?.classes()).toContain('w-1/3')
  })

  it('タップで得点が増え、遷移が伸びる', async () => {
    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await increaseButton(component, 'Ryoh Hashimoto')?.trigger('click')
    await increaseButton(component, 'Kengo Sato')?.trigger('click')
    await increaseButton(component, 'Ryoh Hashimoto')?.trigger('click')

    expect(scores(component)).toEqual(['2', '1'])
    expect(component.text()).toContain('0 - 0')
    expect(component.text()).toContain('1 - 0')
    expect(component.text()).toContain('1 - 1')
    expect(component.text()).toContain('2 - 1')
  })

  // 交互に取り消すと直前の1点ではなく、そのプレイヤーの最後の1点が消える。
  it('取り消しはそのプレイヤーの最後の1点だけを取り除く', async () => {
    seedMatch([0, 1, 0])

    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await decreaseButton(component, 'Kengo Sato')?.trigger('click')

    expect(scores(component)).toEqual(['2', '0'])
    expect(component.text()).toContain('2 - 0')
    expect(component.text()).not.toContain('1 - 1')
  })

  it('0からは取り消せない', async () => {
    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await decreaseButton(component, 'Ryoh Hashimoto')?.trigger('click')

    expect(scores(component)).toEqual(['0', '0'])
  })

  it('必要セット数に達すると勝者と結果を出す', async () => {
    seedMatch([0, 0])

    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await increaseButton(component, 'Ryoh Hashimoto')?.trigger('click')

    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.scoreboard.winner', {
        name: 'Ryoh Hashimoto',
      }),
    )
    expect(component.text()).toContain(
      jaMessage('games.fairSingleRace.scoreboard.rematch'),
    )
  })

  // 決着後の誤タップで結果を動かさない。
  it('決着後はタップしても得点が変わらない', async () => {
    seedMatch([0, 0, 0])

    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await increaseButton(component, 'Kengo Sato')?.trigger('click')
    await decreaseButton(component, 'Ryoh Hashimoto')?.trigger('click')

    expect(scores(component)).toEqual(['3', '0'])
  })

  it('もう一度で同じセット数のまま0-0から始める', async () => {
    seedMatch([0, 0, 0])

    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    await component
      .findAll('button')
      .find((button) =>
        button
          .text()
          .includes(jaMessage('games.fairSingleRace.scoreboard.rematch')),
      )
      ?.trigger('click')

    expect(scores(component)).toEqual(['0', '0'])
    expect(
      JSON.parse(
        sessionStorage.getItem('fairrace:match:fair-single-race') ?? '{}',
      ),
    ).toMatchObject({ playerRaceTo: 3, history: [] })
  })

  it('終了でマッチを破棄し、ゲームと対戦相手は残して入口へ戻る', async () => {
    seedMatch([0, 0, 0])

    const component = await mountPage()
    await vi.waitFor(() => expect(component.text()).toContain('Kengo Sato'))

    // ヘッダーの「終了」と同じ文言のため、結果ダイアログの中に絞って探す。
    const resultDialog = component.findAll('dialog').at(-1)
    await resultDialog
      ?.findAll('button')
      .find((button) =>
        button
          .text()
          .includes(jaMessage('games.fairSingleRace.scoreboard.finish')),
      )
      ?.trigger('click')
    await vi.waitFor(() =>
      expect(navigateToMock).toHaveBeenCalledWith('/games'),
    )

    expect(sessionStorage.getItem('fairrace:match:fair-single-race')).toBeNull()
    expect(
      JSON.parse(sessionStorage.getItem('fairrace:gameSetup') ?? '{}').opponent,
    ).toEqual(OPPONENT)
  })
})
