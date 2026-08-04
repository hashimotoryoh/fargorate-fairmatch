import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/auth/refresh.post'
import { callHandler } from '../../../../helpers/h3'
import {
  MEMBERSHIP_ID,
  createFargoRatePlayer,
  createGuestPlayer,
} from '../../../../helpers/fixtures'

/**
 * セッションのプレイヤーを引き直すサーバールートを確かめる。
 * ルックアップの実体だけを差し替え、検索キーの選びかたと保存の有無を見る。
 */
describe('POST /api/auth/refresh', () => {
  const requireUserSession = vi.fn()
  const lookupPlayerProfile = vi.fn()
  const setUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('requireUserSession', requireUserSession)
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    vi.stubGlobal('setUserSession', setUserSession)
  })

  it('readableIdを検索キーに引き直し、結果をセッションに保存して返す', async () => {
    const stored = createFargoRatePlayer({ rating: 500 })
    const refreshed = createFargoRatePlayer({ rating: 523 })
    requireUserSession.mockResolvedValue({ user: stored })
    lookupPlayerProfile.mockResolvedValue(refreshed)

    const response = await callHandler(handler, {})

    expect(response.status).toBe(200)
    expect(response.body).toEqual(refreshed)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      stored.readableId,
      MEMBERSHIP_ID,
    )
    expect(setUserSession).toHaveBeenCalledWith(expect.anything(), {
      user: refreshed,
    })
  })

  it('readableIdで見つからなければ名前で引き直す', async () => {
    const stored = createFargoRatePlayer()
    const refreshed = createFargoRatePlayer({ rating: 530 })
    requireUserSession.mockResolvedValue({ user: stored })
    lookupPlayerProfile
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(refreshed)

    const response = await callHandler(handler, {})

    expect(response.body).toEqual(refreshed)
    expect(lookupPlayerProfile).toHaveBeenNthCalledWith(
      2,
      stored.name,
      MEMBERSHIP_ID,
    )
  })

  it('readableIdが無ければ最初から名前で引き直す', async () => {
    const stored = createFargoRatePlayer({ readableId: null })
    requireUserSession.mockResolvedValue({ user: stored })
    lookupPlayerProfile.mockResolvedValue(stored)

    await callHandler(handler, {})

    expect(lookupPlayerProfile).toHaveBeenCalledTimes(1)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      stored.name,
      MEMBERSHIP_ID,
    )
  })

  // 外部APIの応答の揺れでゲームの開始を止めない。
  it('どの検索でも見つからなければ、既存の値のまま保存せずに返す', async () => {
    const stored = createFargoRatePlayer()
    requireUserSession.mockResolvedValue({ user: stored })
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, {})

    expect(response.status).toBe(200)
    expect(response.body).toEqual(stored)
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('ゲストのセッションでは外部を呼ばず、そのまま返す', async () => {
    const guest = createGuestPlayer()
    requireUserSession.mockResolvedValue({ user: guest })

    const response = await callHandler(handler, {})

    expect(response.status).toBe(200)
    expect(response.body).toEqual(guest)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
    expect(setUserSession).not.toHaveBeenCalled()
  })

  // 引き直す対象はセッションが持つ本人だけで、ボディの指定は効かない。
  it('ボディに別のIDを送っても、検索の鍵にはセッションの値だけを使う', async () => {
    const stored = createFargoRatePlayer()
    requireUserSession.mockResolvedValue({ user: stored })
    lookupPlayerProfile.mockResolvedValue(stored)

    await callHandler(handler, {
      membershipId: '9999999999999',
      name: 'Someone Else',
    })

    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      stored.readableId,
      MEMBERSHIP_ID,
    )
  })

  it('セッションが無ければ 401 を返す', async () => {
    requireUserSession.mockRejectedValue(
      createError({ statusCode: 401, statusMessage: 'Unauthorized' }),
    )

    const response = await callHandler(handler, {})

    expect(response.status).toBe(401)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })
})
