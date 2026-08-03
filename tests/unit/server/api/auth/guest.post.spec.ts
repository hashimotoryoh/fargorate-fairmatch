import { beforeEach, describe, expect, it, vi } from 'vitest'
import handler from '../../../../../server/api/auth/guest.post'
import { callHandler } from '../../../../helpers/h3'
import { FARGORATE_ID } from '../../../../helpers/fixtures'
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
} from '../../../../../shared/utils/guestPlayer'

describe('POST /api/auth/guest', () => {
  const setUserSession = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('setUserSession', setUserSession)
    // reCAPTCHA検証は既定で成功させる。失敗時の挙動は個別のテストで確かめる。
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: true, score: 0.9, action: 'guest' }),
    )
  })

  it('名前とレーティングをゲストとしてセッションへ保存する', async () => {
    const response = await callHandler(handler, {
      name: 'Jiro Suzuki',
      rating: 450,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      kind: 'guest',
      name: 'Jiro Suzuki',
      rating: 450,
    })
    expect(setUserSession.mock.calls[0]?.[1]).toEqual({
      user: { kind: 'guest', name: 'Jiro Suzuki', rating: 450 },
    })
  })

  it('名前を省略したら null を保存する', async () => {
    const response = await callHandler(handler, {
      rating: 450,
      recaptchaToken: 'valid-token',
    })

    expect(response.body).toEqual({ kind: 'guest', name: null, rating: 450 })
  })

  it('空白だけの名前は未入力として扱う', async () => {
    const response = await callHandler(handler, {
      name: '   ',
      rating: 450,
      recaptchaToken: 'valid-token',
    })

    expect(response.body).toEqual({ kind: 'guest', name: null, rating: 450 })
  })

  it('名前の前後の空白を落とす', async () => {
    const response = await callHandler(handler, {
      name: '  Jiro Suzuki  ',
      rating: 450,
      recaptchaToken: 'valid-token',
    })

    expect(response.body).toEqual({
      kind: 'guest',
      name: 'Jiro Suzuki',
      rating: 450,
    })
  })

  /**
   * ゲストは自己申告しか受け取れないぶん、申告できる範囲を絞る意味が大きい。
   * FargoRate側と違って引き直して裏を取ることができない。
   */
  it.each([GUEST_RATING_MIN, GUEST_RATING_MAX, 0])(
    'レーティング %i を受け入れる',
    async (rating) => {
      const response = await callHandler(handler, {
        rating,
        recaptchaToken: 'valid-token',
      })

      expect(response.status).toBe(200)
    },
  )

  it.each([GUEST_RATING_MIN - 1, GUEST_RATING_MAX + 1, 450.5])(
    'レーティング %s は 400 を返し、セッションを書き込まない',
    async (rating) => {
      const response = await callHandler(handler, {
        rating,
        recaptchaToken: 'valid-token',
      })

      expect(response.status).toBe(400)
      expect(setUserSession).not.toHaveBeenCalled()
    },
  )

  it.each([undefined, '450', null])(
    'レーティングが %s なら 400 を返し、セッションを書き込まない',
    async (rating) => {
      const response = await callHandler(handler, {
        rating,
        recaptchaToken: 'valid-token',
      })

      expect(response.status).toBe(400)
      expect(setUserSession).not.toHaveBeenCalled()
    },
  )

  it('名前が長すぎれば 400 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, {
      name: 'あ'.repeat(GUEST_NAME_MAX_LENGTH + 1),
      rating: 450,
      recaptchaToken: 'valid-token',
    })

    expect(response.status).toBe(400)
    expect(setUserSession).not.toHaveBeenCalled()
  })

  /**
   * ゲストがFargoRateで確認が取れたプレイヤーを騙れてはならない。
   * ボディを展開せず、必要な項目だけを読んで組み立てていることを確かめる。
   */
  it('クライアントが送ったFargoRate固有の項目を無視する', async () => {
    const response = await callHandler(handler, {
      name: 'Cheater McFake',
      rating: 450,
      recaptchaToken: 'valid-token',
      kind: 'fargorate',
      fargorateId: FARGORATE_ID,
      robustness: 9999,
      leagueName: 'Tokyo League',
      region: 'Kanto',
      teamNames: 'Team Alpha',
    })

    const saved = setUserSession.mock.calls[0]?.[1]

    expect(saved).toEqual({
      user: { kind: 'guest', name: 'Cheater McFake', rating: 450 },
    })
    expect(response.body).toEqual({
      kind: 'guest',
      name: 'Cheater McFake',
      rating: 450,
    })
  })

  /**
   * 未認証で誰でも叩けるルートなので、ボットにセッションを量産されないよう
   * reCAPTCHAを通す。ここが素通しになると、そのセッションが
   * `POST /api/players/lookup` のreCAPTCHAを免れる鍵になってしまう。
   */
  it('reCAPTCHAの検証に失敗したら 422 を返し、セッションを書き込まない', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({ success: false, score: 0.1 }),
    )

    const response = await callHandler(handler, {
      rating: 450,
      recaptchaToken: 'invalid-token',
    })

    expect(response.status).toBe(422)
    expect(setUserSession).not.toHaveBeenCalled()
  })

  it('reCAPTCHAのトークンが無ければ 422 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, { rating: 450 })

    expect(response.status).toBe(422)
    expect(setUserSession).not.toHaveBeenCalled()
  })

  // アクション名を機能ごとに分けている。ここが他の機能の名前だと分析が濁る。
  it('reCAPTCHAのアクションは guest で検証する', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockResolvedValue({
        success: true,
        score: 0.9,
        action: 'playerLookup',
      }),
    )

    const response = await callHandler(handler, {
      rating: 450,
      recaptchaToken: 'token-for-another-screen',
    })

    expect(response.status).toBe(422)
    expect(setUserSession).not.toHaveBeenCalled()
  })

  // 入力が不正なら、reCAPTCHAの検証まで行かずに弾く。
  it('レーティングが不正ならreCAPTCHAを検証しない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)

    const response = await callHandler(handler, { rating: 'invalid' })

    expect(response.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
