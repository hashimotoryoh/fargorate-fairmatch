import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/link/lookup.post'
import { callHandler } from '../../../../helpers/h3'
import {
  MEMBERSHIP_ID,
  createFargoRatePlayer,
} from '../../../../helpers/fixtures'

/**
 * ルックアップのサーバールートを、リクエストからの一連の流れとして確かめる。
 * 外部APIとの通信だけを差し替え、検証・ルックアップ・応答の組み立ては本物を通す。
 */
describe('POST /api/link/lookup', () => {
  const lookupPlayerProfile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    // reCAPTCHA検証は既定で成功させる。失敗時の挙動は個別のテストで確かめる。
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: true, score: 0.9, action: 'link' }),
    )
  })

  it('名前とメンバーシップIDで引いたプレイヤーの情報を返す', async () => {
    const profile = createFargoRatePlayer()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(profile)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(
      'Taro Yamada',
      MEMBERSHIP_ID,
    )
  })

  // 外部APIへの総当たりを防ぐための関門なので、ここで弾けばルックアップ自体をさせない。
  it('reCAPTCHAの検証に失敗したら 422 を返し、ルックアップを行わない', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: false, score: 0.1 }),
    )

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      recaptchaToken: 'invalid-token',
    })

    expect(response.status).toBe(422)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  it('該当が無ければ 404 を返す', async () => {
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(404)
    expect(response.statusMessage).toBe('Player not found')
  })

  it('メンバーシップIDの形式が不正なら 400 を返し、ルックアップを行わない', async () => {
    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: '99000012345ab',
    })

    expect(response.status).toBe(400)
    expect(response.statusMessage).toBe(
      'membershipId must be a string of digits',
    )
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  // かつては13桁の固定長としていたが、桁数が一定しないことが判明した。
  it('13桁でないメンバーシップIDも受け付ける', async () => {
    const profile = createFargoRatePlayer({ membershipId: '123' })
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: '123',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(lookupPlayerProfile).toHaveBeenCalledWith('Taro Yamada', '123')
  })

  it('名前が短すぎれば 400 を返し、ルックアップを行わない', async () => {
    const response = await callHandler(handler, {
      name: 'a',
      membershipId: MEMBERSHIP_ID,
    })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  it('名前が無ければ 400 を返す', async () => {
    const response = await callHandler(handler, { membershipId: MEMBERSHIP_ID })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  it('メンバーシップIDが無ければ 400 を返す', async () => {
    const response = await callHandler(handler, { name: 'Taro Yamada' })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  // 「見つからない」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 をそのまま返す', async () => {
    lookupPlayerProfile.mockRejectedValue(
      createError({
        statusCode: 502,
        statusMessage: 'Failed to reach the FargoRate membership lookup API',
      }),
    )

    const response = await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(502)
  })

  // このルートは確認画面に見せるためのもので、認証は確定させない。
  it('セッションを書き込まない', async () => {
    const setUserSession = vi.fn()
    vi.stubGlobal('setUserSession', setUserSession)
    lookupPlayerProfile.mockResolvedValue(createFargoRatePlayer())

    await callHandler(handler, {
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      recaptchaToken: 'valid-token',
    })

    expect(setUserSession).not.toHaveBeenCalled()
  })
})
