import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import GamesPage from '../../../../app/pages/games/index.vue'
import { jaMessage } from '../../../helpers/i18n'
import { createFargoRatePlayer } from '../../../helpers/fixtures'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }))

mockNuxtImport('navigateTo', () => navigateToMock)

// マウントしたまま次のテストで clearNuxtState() すると、残ったインスタンスの
// 再レンダーが undefined になった状態を読んで落ちる。テストごとに必ず
// アンマウントする。
let wrapper: VueWrapper | undefined

async function mountPage() {
  wrapper = await mountSuspended(GamesPage)
  return wrapper
}

describe('ゲーム一覧ページ', () => {
  beforeEach(() => {
    wrapper?.unmount()
    wrapper = undefined
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    clearNuxtState()
  })

  it('提供予定を含む全ゲームを説明つきで並べる', async () => {
    const component = await mountPage()

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
    const component = await mountPage()

    const comingSoon = component
      .findAll('button[disabled]')
      .filter((button) => button.text().includes(jaMessage('games.comingSoon')))
    expect(comingSoon).toHaveLength(3)
  })

  // 入口では選択を丸ごと作り直す。前回の対戦相手が残っていると、選んでいない
  // ステップが完了済みで始まってしまう。
  it('ゲームを選ぶと前回の対戦相手を捨てて、ブリーフィングへ移る', async () => {
    sessionStorage.setItem(
      'fairrace:gameSetup',
      JSON.stringify({
        slug: null,
        opponent: createFargoRatePlayer(),
        returnTo: null,
      }),
    )

    const component = await mountPage()

    const card = component
      .findAll('button')
      .find((button) =>
        button.text().includes(jaMessage('games.types.fairSingleRace.label')),
      )
    await card?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/games/briefing')
    expect(
      JSON.parse(sessionStorage.getItem('fairrace:gameSetup') ?? '{}'),
    ).toMatchObject({ slug: 'fair-single-race', opponent: null })
  })

  it('最近の対戦プレイヤーが無ければ一覧を出さない', async () => {
    const component = await mountPage()

    expect(component.text()).not.toContain(
      jaMessage('games.recentOpponents.label'),
    )
  })

  // 対戦相手はURLに載せず、状態に書き込んでからブリーフィングへ移る。
  // 前回のゲームが残っていると、ゲームを選ばずステップ3から始まってしまう。
  it('最近の対戦プレイヤーを選ぶと前回のゲームを捨てて、IDをURLに載せずにブリーフィングへ移る', async () => {
    sessionStorage.setItem(
      'fairrace:gameSetup',
      JSON.stringify({
        slug: 'fair-single-race',
        opponent: null,
        returnTo: null,
      }),
    )
    const stored = createFargoRatePlayer({ name: 'Alex Morgan' })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountPage()
    const button = component
      .findAll('button')
      .find((candidate) => candidate.text().includes('Alex Morgan'))
    await button?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/games/briefing')
    expect(
      JSON.parse(sessionStorage.getItem('fairrace:gameSetup') ?? '{}'),
    ).toMatchObject({ slug: null, opponent: stored })
  })

  it('最近の対戦プレイヤーに所在地とレーティングと信頼度を出す', async () => {
    const stored = createFargoRatePlayer({ name: 'Alex Morgan' })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountPage()
    const card = component
      .findAll('button')
      .find((candidate) => candidate.text().includes('Alex Morgan'))

    expect(card?.text()).toContain('Tokyo')
    expect(card?.findAll('.stat')).toHaveLength(2)
    expect(card?.text()).toContain('523')
    expect(card?.text()).toContain('412')
  })

  it('最近の対戦プレイヤーを個別に削除できる', async () => {
    const stored = createFargoRatePlayer({ name: 'Alex Morgan' })
    localStorage.setItem('fairrace:recentOpponents', JSON.stringify([stored]))

    const component = await mountPage()
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
