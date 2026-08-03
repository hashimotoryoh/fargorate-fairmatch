import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/players/lookup.post'
import { callHandler } from '../../../../helpers/h3'
import {
  FARGORATE_ID,
  createFargoRatePlayer,
} from '../../../../helpers/fixtures'
import { PLAYER_QUERY_MAX_LENGTH } from '../../../../../shared/utils/playerQuery'

/**
 * プレイヤー検索のサーバールートを、リクエストからの一連の流れとして確かめる。
 * 検索そのものは差し替え、検証・分岐・応答の組み立ては本物を通す。
 */
describe('POST /api/players/lookup', () => {
  const searchPlayersByName = vi.fn()
  const lookupPlayerProfile = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('searchPlayersByName', searchPlayersByName)
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    // reCAPTCHA検証は既定で成功させる。失敗時の挙動は個別のテストで確かめる。
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({
        success: true,
        score: 0.9,
        action: 'playerLookup',
      }),
    )
  })

  it('名前で検索した結果をそのまま返す', async () => {
    const players = [
      {
        name: 'Taro Yamada',
        fargorateId: FARGORATE_ID,
        rating: 523,
        robustness: 412,
      },
    ]
    searchPlayersByName.mockResolvedValue(players)

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(players)
    expect(searchPlayersByName).toHaveBeenCalledWith('Taro Yamada')
  })

  // 該当が無いのは異常ではないため、404ではなく空配列で表す。
  it('該当が無ければ空配列を返す', async () => {
    searchPlayersByName.mockResolvedValue([])

    const response = await callHandler(handler, {
      query: 'Nobody Here',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('前後の空白を落として検索する', async () => {
    searchPlayersByName.mockResolvedValue([])

    await callHandler(handler, {
      query: '  Taro Yamada  ',
      recaptchaToken: 'valid-token',
    })

    expect(searchPlayersByName).toHaveBeenCalledWith('Taro Yamada')
  })

  /**
   * 画面では案内していない経路。FargoRate側のAPIは名前でしか引けないため、
   * IDでの検索はCSIを経由する `lookupPlayerProfile` に切り替わる。
   */
  it('13桁のFargoRate IDならIDでの検索に切り替える', async () => {
    lookupPlayerProfile.mockResolvedValue(createFargoRatePlayer())

    const response = await callHandler(handler, {
      query: FARGORATE_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(lookupPlayerProfile).toHaveBeenCalledWith(FARGORATE_ID)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  /**
   * IDで引くとCSI由来のリーグなども得られるが、名前で引いた場合と応答の形が
   * 変わると呼び出し側が分岐することになる。共通の項目だけに揃える。
   */
  it('IDでの検索でも名前での検索と同じ形で返す', async () => {
    lookupPlayerProfile.mockResolvedValue(createFargoRatePlayer())

    const response = await callHandler(handler, {
      query: FARGORATE_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.body).toEqual([
      {
        name: 'Taro Yamada',
        fargorateId: FARGORATE_ID,
        rating: 523,
        robustness: 412,
      },
    ])
  })

  it('IDでの検索で該当が無ければ空配列を返す', async () => {
    lookupPlayerProfile.mockResolvedValue(null)

    const response = await callHandler(handler, {
      query: FARGORATE_ID,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  // 外部APIへの総当たりを防ぐための関門なので、ここで弾けば検索自体をさせない。
  it('reCAPTCHAの検証に失敗したら 422 を返し、検索を行わない', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: false, score: 0.1 }),
    )

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'invalid-token',
    })

    expect(response.status).toBe(422)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  /**
   * アクション名をクライアントから受け取ると、他の画面向けに取得したトークンを
   * 選んで使えてしまう。ルート側で固定していることを固定する。
   */
  it('reCAPTCHAのアクションは playerLookup で検証する', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ success: true, score: 0.9, action: 'link' })
    vi.stubGlobal('$fetch', fetchMock)

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'token-for-another-screen',
      action: 'link',
    })

    expect(response.status).toBe(422)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  it('検索語が短すぎれば 400 を返し、検索を行わない', async () => {
    const response = await callHandler(handler, { query: 'a' })

    expect(response.status).toBe(400)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  it('検索語が長すぎれば 400 を返す', async () => {
    const response = await callHandler(handler, {
      query: 'a'.repeat(PLAYER_QUERY_MAX_LENGTH + 1),
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(400)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  it('検索語が無ければ 400 を返す', async () => {
    const response = await callHandler(handler, {})

    expect(response.status).toBe(400)
    expect(searchPlayersByName).not.toHaveBeenCalled()
  })

  // 「0件」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 をそのまま返す', async () => {
    searchPlayersByName.mockRejectedValue(
      createError({
        statusCode: 502,
        statusMessage: 'Failed to reach the FargoRate membership lookup API',
      }),
    )

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(502)
  })

  // 他人を調べるだけのルートであり、セッションには一切触れない。
  it('セッションを書き込まない', async () => {
    const setUserSession = vi.fn()
    vi.stubGlobal('setUserSession', setUserSession)
    searchPlayersByName.mockResolvedValue([])

    await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(setUserSession).not.toHaveBeenCalled()
  })
})
