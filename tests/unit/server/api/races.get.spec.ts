import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../server/api/races.get'
import { callGetHandler } from '../../../helpers/h3'
import { createFargoRateRaces } from '../../../helpers/fixtures'

/**
 * セット数の候補を返すサーバールートを、リクエストからの一連の流れとして
 * 確かめる。外部APIとの通信とセッションの検査だけを差し替える。
 */
describe('GET /api/races', () => {
  const requireUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    requireUserSession.mockResolvedValue({ user: { kind: 'guest' } })
    vi.stubGlobal('requireUserSession', requireUserSession)
    vi.stubGlobal('$fetch', vi.fn().mockResolvedValue(createFargoRateRaces()))
  })

  it('2人のレーティングから、自分と相手の向きに正規化した候補を返す', async () => {
    const response = await callGetHandler(handler, {
      playerRating: '419',
      opponentRating: '576',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([
      { playerRaceTo: 2, opponentRaceTo: 3, recommended: false },
      { playerRaceTo: 5, opponentRaceTo: 12, recommended: true },
      { playerRaceTo: 6, opponentRaceTo: 13, recommended: false },
    ])
  })

  // 非公式の外部APIへの入口なので、セッションの無いリクエストは素通しにしない。
  it('セッションが無ければ 401 を返し、外部APIを呼ばない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    requireUserSession.mockRejectedValue(
      createError({ statusCode: 401, statusMessage: 'Unauthorized' }),
    )

    const response = await callGetHandler(handler, {
      playerRating: '419',
      opponentRating: '576',
    })

    expect(response.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('レーティングが範囲外なら 400 を返し、外部APIを呼ばない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)

    const response = await callGetHandler(handler, {
      playerRating: '10000',
      opponentRating: '576',
    })

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('レーティングが無ければ 400 を返す', async () => {
    const response = await callGetHandler(handler, { playerRating: '419' })

    expect(response.status).toBe(400)
  })

  it('外部APIに到達できなければ 502 をそのまま返す', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    )

    const response = await callGetHandler(handler, {
      playerRating: '419',
      opponentRating: '576',
    })

    expect(response.status).toBe(502)
  })
})
