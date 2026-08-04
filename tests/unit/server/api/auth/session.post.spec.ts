import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/auth/session.post'
import { callHandler } from '../../../../helpers/h3'
import {
  MEMBERSHIP_ID,
  createFargoRatePlayer,
} from '../../../../helpers/fixtures'

describe('POST /api/auth/session', () => {
  const lookupPlayerProfile = vi.fn()
  const setUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    vi.stubGlobal('setUserSession', setUserSession)
  })

  it('ルックアップし直した情報をセッションへ保存する', async () => {
    const profile = createFargoRatePlayer()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(profile)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      'Taro Yamada',
      MEMBERSHIP_ID,
    )
    expect(setUserSession).toHaveBeenCalledTimes(1)
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({ user: profile })
  })

  /**
   * クライアントが任意の名前やレーティングを自称できてはならない。
   * 受け取る名前とメンバーシップIDは検索の鍵としてだけ使い、保存するのは
   * サーバー側で引き直した結果。
   */
  it('クライアントが送ったレーティングなどの項目を無視する', async () => {
    const profile = createFargoRatePlayer()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      rating: 830,
      robustness: 9999,
      user: { rating: 830 },
    })

    expect(response.body).toEqual(profile)
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({ user: profile })
  })

  // 名前は検索の鍵にすぎない。セッションに残る表示名はAPIの応答の表記を使う。
  it('保存する名前はクライアントの入力ではなくルックアップの結果を使う', async () => {
    const profile = createFargoRatePlayer({ name: 'Taro Yamada' })
    lookupPlayerProfile.mockResolvedValue(profile)

    await callHandler(handler, {
      name: 'taro yamada',
      membershipId: MEMBERSHIP_ID,
    })

    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      'taro yamada',
      MEMBERSHIP_ID,
    )
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({ user: profile })
  })

  it('該当が無ければ 404 を返し、セッションを書き込まない', async () => {
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
    })

    expect(response.status).toBe(404)
    expect(response.statusMessage).toBe('Player not found')
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('メンバーシップIDの形式が不正なら 400 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: 'abc',
    })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('名前が無ければ 400 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, { membershipId: MEMBERSHIP_ID })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('外部APIに到達できなければ 502 を返し、セッションを書き込まない', async () => {
    lookupPlayerProfile.mockRejectedValue(
      createError({ statusCode: 502, statusMessage: 'Failed to reach' }),
    )

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
    })

    expect(response.status).toBe(502)
    expect(setUserSession).not.toHaveBeenCalled()
  })
})
