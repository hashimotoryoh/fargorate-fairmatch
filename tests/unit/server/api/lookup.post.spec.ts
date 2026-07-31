import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../server/api/lookup.post'
import { callHandler } from '../../../helpers/h3'
import { FARGORATE_ID, createPlayerProfile } from '../../../helpers/fixtures'

/**
 * ルックアップのサーバールートを、リクエストからの一連の流れとして確かめる。
 * 外部APIとの通信だけを差し替え、検証・ルックアップ・応答の組み立ては本物を通す。
 */
describe('POST /api/lookup', () => {
  const lookupPlayerProfile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
  })

  it('該当するプレイヤーの情報を返す', async () => {
    const profile = createPlayerProfile()
    lookupPlayerProfile.mockResolvedValue(profile)

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(profile)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(FARGORATE_ID)
  })

  it('該当が無ければ 404 を返す', async () => {
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(404)
    expect(response.statusMessage).toBe('Player not found')
  })

  it('FargoRate IDの形式が不正なら 400 を返し、ルックアップを行わない', async () => {
    const response = await callHandler(handler, { fargorateId: '123' })

    expect(response.status).toBe(400)
    expect(response.statusMessage).toBe('fargorateId must be a 13-digit number')
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  it('FargoRate IDが無ければ 400 を返す', async () => {
    const response = await callHandler(handler, {})

    expect(response.status).toBe(400)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
  })

  // 「見つからない」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 をそのまま返す', async () => {
    lookupPlayerProfile.mockRejectedValue(
      createError({
        statusCode: 502,
        statusMessage: 'Failed to reach the CSI membership lookup API',
      }),
    )

    const response = await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(response.status).toBe(502)
  })

  // このルートは確認画面に見せるためのもので、認証は確定させない。
  it('セッションを書き込まない', async () => {
    const setUserSession = vi.fn()
    vi.stubGlobal('setUserSession', setUserSession)
    lookupPlayerProfile.mockResolvedValue(createPlayerProfile())

    await callHandler(handler, { fargorateId: FARGORATE_ID })

    expect(setUserSession).not.toHaveBeenCalled()
  })
})
