import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GamesPage from '../../../../app/pages/games/index.vue'
import { jaMessage } from '../../../helpers/i18n'
import { createFargoRatePlayer } from '../../../helpers/fixtures'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))

mockNuxtImport('navigateTo', () => navigateToMock)

describe('ゲーム一覧ページ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    clearNuxtState()
  })

  it('提供予定を含む全ゲームを説明つきで並べる', async () => {
    const component = await mountSuspended(GamesPage)

    expect(component.text()).toContain(
      jaMessage('games.types.fairSingleRace.label'),
    )
    expect(component.text()).toContain(
      jaMessage('games.types.customSingleRace.label'),
    )
    expect(component.text()).toContain(
      jaMessage('games.types.usapl9Ball.label'),
    )
    expect(component.text()).toContain(
      jaMessage('games.types.usapl8Ball.label'),
    )
  })

  it('準備中のゲームは選べない', async () => {
    const component = await mountSuspended(GamesPage)

    const comingSoon = component
      .findAll('button[disabled]')
      .filter((button) => button.text().includes(jaMessage('games.comingSoon')))
    expect(comingSoon).toHaveLength(3)
  })

  // ゲームは公開情報のスラッグなので、クエリの種としてブリーフィングへ渡す。
  it('ゲームを選ぶと ?game= を付けてブリーフィングへ移る', async () => {
    const component = await mountSuspended(GamesPage)

    const card = component
      .findAll('button')
      .find((button) =>
        button.text().includes(jaMessage('games.types.fairSingleRace.label')),
      )
    await card?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith(
      '/games/briefing?game=fair-single-race',
    )
  })

  it('最近の対戦相手が無ければ一覧を出さない', async () => {
    const component = await mountSuspended(GamesPage)

    expect(component.text()).not.toContain(
      jaMessage('games.recentOpponents.label'),
    )
  })

  // 対戦相手はURLに載せず、状態に書き込んでからブリーフィングへ移る。
  it('最近の対戦相手を選ぶと、IDをURLに載せずにブリーフィングへ移る', async () => {
    const stored = createFargoRatePlayer({ name: 'Alex Morgan' })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountSuspended(GamesPage)
    const button = component
      .findAll('button')
      .find((candidate) => candidate.text().includes('Alex Morgan'))
    await button?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/games/briefing')
    expect(
      JSON.parse(sessionStorage.getItem('fairrace:gameSetup') ?? '{}').opponent,
    ).toEqual(stored)
  })

  it('最近の対戦相手を個別に削除できる', async () => {
    const stored = createFargoRatePlayer({ name: 'Alex Morgan' })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountSuspended(GamesPage)
    const removeButton = component
      .findAll('button')
      .find(
        (button) =>
          button.attributes('aria-label') ===
          jaMessage('games.recentOpponents.remove', { name: 'Alex Morgan' }),
      )
    await removeButton?.trigger('click')

    expect(component.text()).not.toContain('Alex Morgan')
    expect(
      JSON.parse(localStorage.getItem('fairrace:recentOpponents') ?? '[]'),
    ).toEqual([])
  })
})
