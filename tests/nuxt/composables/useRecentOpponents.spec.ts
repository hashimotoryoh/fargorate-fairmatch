import { mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtState } from '#imports'
import { defineComponent } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFargoRatePlayer } from '../../helpers/fixtures'

const STORAGE_KEY = 'fairrace:recentOpponents'

// onMounted で localStorage から読み戻すため、コンポーネントに載せて使う。
const Harness = defineComponent({
  setup() {
    return useRecentOpponents()
  },
  template: '<div />',
})

async function mountHarness() {
  const component = await mountSuspended(Harness)
  return component.vm
}

function opponentAt(rating: number, index: number) {
  return createFargoRatePlayer({
    membershipId: String(9900000000000 + index),
    name: `Player ${index}`,
    rating,
  })
}

describe('useRecentOpponents', () => {
  beforeEach(() => {
    localStorage.clear()
    clearNuxtState()
  })

  it('追加した相手を先頭に積み、localStorageへ保存する', async () => {
    const vm = await mountHarness()
    const first = opponentAt(400, 1)
    const second = opponentAt(500, 2)

    vm.addRecentOpponent(first)
    vm.addRecentOpponent(second)

    expect(vm.recentOpponents.map((o) => o.name)).toEqual([
      'Player 2',
      'Player 1',
    ])
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')).toHaveLength(
      2,
    )
  })

  it('同じ相手はまとめて先頭へ移す', async () => {
    const vm = await mountHarness()
    const opponent = opponentAt(400, 1)

    vm.addRecentOpponent(opponent)
    vm.addRecentOpponent(opponentAt(500, 2))
    vm.addRecentOpponent({ ...opponent, rating: 410 })

    expect(vm.recentOpponents.map((o) => o.rating)).toEqual([410, 500])
  })

  it('上限の20件を超えると古いものから落ちる', async () => {
    const vm = await mountHarness()

    for (let i = 0; i < 22; i += 1) {
      vm.addRecentOpponent(opponentAt(400 + i, i))
    }

    expect(vm.recentOpponents).toHaveLength(20)
    expect(vm.recentOpponents[0]?.name).toBe('Player 21')
    expect(vm.recentOpponents.at(-1)?.name).toBe('Player 2')
  })

  it('個別に削除できる', async () => {
    const vm = await mountHarness()
    const first = opponentAt(400, 1)

    vm.addRecentOpponent(first)
    vm.addRecentOpponent(opponentAt(500, 2))
    vm.removeRecentOpponent(first.membershipId)

    expect(vm.recentOpponents.map((o) => o.name)).toEqual(['Player 2'])
  })

  it('全件削除でlocalStorageからも消える', async () => {
    const vm = await mountHarness()
    vm.addRecentOpponent(opponentAt(400, 1))

    vm.clearRecentOpponents()

    expect(vm.recentOpponents).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  // 壊れた値でも例外を握りつぶし、一覧なしで続行する。
  it('localStorageの値が壊れていても空の一覧で続行する', async () => {
    localStorage.setItem(STORAGE_KEY, '{not valid json')

    const vm = await mountHarness()

    expect(vm.recentOpponents).toEqual([])
  })

  // ゲストや形の違う値を対戦相手として復元しない。
  it('検証に通らない保存値は読み飛ばす', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { kind: 'guest', name: 'Guest', rating: 400 },
        opponentAt(450, 1),
        { kind: 'fargorate', name: 'Broken' },
      ]),
    )

    const vm = await mountHarness()

    expect(vm.recentOpponents.map((o) => o.name)).toEqual(['Player 1'])
  })
})
