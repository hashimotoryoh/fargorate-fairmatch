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
  })

  it('名前とレーティングをゲストとしてセッションへ保存する', async () => {
    const response = await callHandler(handler, {
      name: 'Jiro Suzuki',
      rating: 450,
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
    const response = await callHandler(handler, { rating: 450 })

    expect(response.body).toEqual({ kind: 'guest', name: null, rating: 450 })
  })

  it('空白だけの名前は未入力として扱う', async () => {
    const response = await callHandler(handler, { name: '   ', rating: 450 })

    expect(response.body).toEqual({ kind: 'guest', name: null, rating: 450 })
  })

  it('名前の前後の空白を落とす', async () => {
    const response = await callHandler(handler, {
      name: '  Jiro Suzuki  ',
      rating: 450,
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
      const response = await callHandler(handler, { rating })

      expect(response.status).toBe(200)
    },
  )

  it.each([GUEST_RATING_MIN - 1, GUEST_RATING_MAX + 1, 450.5])(
    'レーティング %s は 400 を返し、セッションを書き込まない',
    async (rating) => {
      const response = await callHandler(handler, { rating })

      expect(response.status).toBe(400)
      expect(setUserSession).not.toHaveBeenCalled()
    },
  )

  it.each([undefined, '450', null])(
    'レーティングが %s なら 400 を返し、セッションを書き込まない',
    async (rating) => {
      const response = await callHandler(handler, { rating })

      expect(response.status).toBe(400)
      expect(setUserSession).not.toHaveBeenCalled()
    },
  )

  it('名前が長すぎれば 400 を返し、セッションを書き込まない', async () => {
    const response = await callHandler(handler, {
      name: 'あ'.repeat(GUEST_NAME_MAX_LENGTH + 1),
      rating: 450,
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

  // reCAPTCHAを付けていないのは外部APIを呼ばないからである。前提が崩れていないか見る。
  it('外部APIへ問い合わせない', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)

    await callHandler(handler, { rating: 450 })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
