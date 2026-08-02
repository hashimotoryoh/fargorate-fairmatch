import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/auth/session.post'
import { callHandler } from '../../../../helpers/h3'
import { FARGORATE_ID, createPlayerProfile } from '../../../../helpers/fixtures'

describe('POST /api/auth/session', () => {
  const lookupPlayerProfile = vi.fn()
  const setUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    vi.stubGlobal('setUserSession', setUserSession)
  })

  it('ルックアップし直した情報をセッションへ保存する', async () => {
    const profile = createPlayerProfile()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(profile)
    expect(setUserSession).toHaveBeenCalledTimes(1)
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({ user: profile })
  })

  /**
   * クライアントが任意の姓名やレーティングを自称できてはならない。
   * 受け取るのはFargoRate IDだけで、保存するのはサーバー側で引き直した結果。
   */
  it('クライアントが送った名前やレーティングを無視する', async () => {
    const profile = createPlayerProfile()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, {
      fargorateId: FARGORATE_ID,
      name: 'Cheater McFake',
      rating: 830,
      robustness: 9999,
      user: { rating: 830 },
    })

    expect(response.body).toEqual(profile)
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({ user: profile })
  })

  it('該当が無ければ 404 を返し、セッションを書き込まない', async () => {
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(404)
    expect(response.statusMessage).toBe('Player not found')
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('FargoRate IDの形式が不正なら 400 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, { fargorateId: 'abc' })

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('外部APIに到達できなければ 502 を返し、セッションを書き込まない', async () => {
    lookupPlayerProfile.mockRejectedValue(
      createError({ statusCode: 502, statusMessage: 'Failed to reach' }),
    )

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(502)
    expect(setUserSession).not.toHaveBeenCalled()
  })
})
