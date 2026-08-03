import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/players/lookup.post'
import { callHandler } from '../../../../helpers/h3'
import { MEMBERSHIP_ID } from '../../../../helpers/fixtures'
import { PLAYER_QUERY_MAX_LENGTH } from '../../../../../shared/utils/playerQuery'

function createSearchResult(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Taro Yamada',
    readableId: '1234567',
    membershipId: MEMBERSHIP_ID,
    location: 'Tokyo',
    rating: 523,
    robustness: 412,
    ...overrides,
  }
}

/**
 * プレイヤー検索のサーバールートを、リクエストからの一連の流れとして確かめる。
 * 検索そのものは差し替え、検証・応答の組み立ては本物を通す。
 */
describe('POST /api/players/lookup', () => {
  const searchPlayers = vi.fn()
  const lookupPlayerProfile = vi.fn()
  const getUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('searchPlayers', searchPlayers)
    vi.stubGlobal('lookupPlayerProfile', lookupPlayerProfile)
    // 既定は未認証。認証済みの挙動は個別のテストで確かめる。
    getUserSession.mockResolvedValue({})
    vi.stubGlobal('getUserSession', getUserSession)
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

  it('検索した結果をそのまま返す', async () => {
    const players = [createSearchResult()]
    searchPlayers.mockResolvedValue(players)

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual(players)
    expect(searchPlayers).toHaveBeenCalledWith('Taro Yamada')
  })

  // 該当が無いのは異常ではないため、404ではなく空配列で表す。
  it('該当が無ければ空配列を返す', async () => {
    searchPlayers.mockResolvedValue([])

    const response = await callHandler(handler, {
      query: 'Nobody Here',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })

  it('前後の空白を落として検索する', async () => {
    searchPlayers.mockResolvedValue([])

    await callHandler(handler, {
      query: '  Taro Yamada  ',
      recaptchaToken: 'valid-token',
    })

    expect(searchPlayers).toHaveBeenCalledWith('Taro Yamada')
  })

  /**
   * FargoRateのAPIは姓名のほか `readableId` でも引ける。画面ではその使い方を
   * 案内していないが、数字だけの入力を弾いてはならない。
   */
  it('数字だけの検索語もそのまま検索へ渡す', async () => {
    searchPlayers.mockResolvedValue([createSearchResult()])

    const response = await callHandler(handler, {
      query: '1234567',
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(searchPlayers).toHaveBeenCalledWith('1234567')
  })

  /**
   * このルートは名前で複数件を返す一覧の経路である。メンバーシップIDの一致で
   * 1件に絞る `lookupPlayerProfile` へ切り替える分岐を持ち込まないこと。
   */
  it('数字だけの検索語でもリンク用のルックアップへ切り替えない', async () => {
    searchPlayers.mockResolvedValue([])

    await callHandler(handler, {
      query: MEMBERSHIP_ID,
      recaptchaToken: 'valid-token',
    })

    expect(searchPlayers).toHaveBeenCalledWith(MEMBERSHIP_ID)
    expect(lookupPlayerProfile).not.toHaveBeenCalled()
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
    expect(searchPlayers).not.toHaveBeenCalled()
  })

  /**
   * アクション名をクライアントから受け取ると、機能ごとに分けた意味が無くなる。
   * ルート側で固定していることを固定する。
   */
  it('reCAPTCHAのアクションは playerLookup で検証する', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: true, score: 0.9, action: 'link' }),
    )

    const response = await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'token-for-another-screen',
      action: 'link',
    })

    expect(response.status).toBe(422)
    expect(searchPlayers).not.toHaveBeenCalled()
  })

  it('検索語が短すぎれば 400 を返し、検索を行わない', async () => {
    const response = await callHandler(handler, { query: 'a' })

    expect(response.status).toBe(400)
    expect(searchPlayers).not.toHaveBeenCalled()
  })

  it('検索語が長すぎれば 400 を返す', async () => {
    const response = await callHandler(handler, {
      query: 'a'.repeat(PLAYER_QUERY_MAX_LENGTH + 1),
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(400)
    expect(searchPlayers).not.toHaveBeenCalled()
  })

  it('検索語が無ければ 400 を返す', async () => {
    const response = await callHandler(handler, {})

    expect(response.status).toBe(400)
    expect(searchPlayers).not.toHaveBeenCalled()
  })

  // 「0件」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 をそのまま返す', async () => {
    searchPlayers.mockRejectedValue(
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

  /**
   * 認証済みの利用者は `/link` か `/guest` で一度reCAPTCHAを通っている。
   * 二重に課すと、画面を開くたびにスクリプトを読み込ませることになる。
   */
  it('認証済みならreCAPTCHAを通さずに検索する', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    getUserSession.mockResolvedValue({ user: { kind: 'guest', rating: 450 } })
    searchPlayers.mockResolvedValue([])

    const response = await callHandler(handler, { query: 'Taro Yamada' })

    expect(response.status).toBe(200)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(searchPlayers).toHaveBeenCalledWith('Taro Yamada')
  })

  // 免除はあくまでセッションがあるときだけ。無いのに素通ししてはならない。
  it('未認証ならreCAPTCHAを通す', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ success: true, score: 0.9, action: 'playerLookup' })
    vi.stubGlobal('$fetch', fetchMock)
    searchPlayers.mockResolvedValue([])

    await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // 他人を調べるだけのルートであり、セッションを書き換えることはない。
  it('セッションを書き込まない', async () => {
    const setUserSession = vi.fn()
    vi.stubGlobal('setUserSession', setUserSession)
    searchPlayers.mockResolvedValue([])

    await callHandler(handler, {
      query: 'Taro Yamada',
      recaptchaToken: 'valid-token',
    })

    expect(setUserSession).not.toHaveBeenCalled()
  })
})
