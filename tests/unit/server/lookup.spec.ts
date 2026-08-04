import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  lookupPlayerProfile,
  readMembershipId,
  readPlayerName,
  readPlayerQuery,
  searchPlayers,
} from '../../../server/utils/lookup'
import {
  MEMBERSHIP_ID,
  createFargoRateLookupPlayer,
} from '../../helpers/fixtures'
import type { FargoRateLookupPlayer } from '../../../shared/types/player'

const FARGORATE_LOOKUP_URL = 'https://dashboard.fargorate.com/api/indexsearch'

type FetchOptions = { query?: { q?: string } }
type MockedResponse = unknown | (() => never)

/**
 * FargoRateの外部APIを模す。
 * 値の代わりに関数を渡すと、その呼び出しで例外を投げる。
 */
function stubFetch(response: MockedResponse) {
  const fetchMock = vi.fn((url: string, _options: FetchOptions = {}) => {
    if (url !== FARGORATE_LOOKUP_URL) {
      throw new Error(`模していないURLが呼ばれた: ${url}`)
    }
    if (typeof response === 'function') {
      return (response as () => never)()
    }

    return Promise.resolve(response)
  })

  vi.stubGlobal('$fetch', fetchMock)

  return fetchMock
}

function fargorateResponse(value: FargoRateLookupPlayer[]) {
  return { value }
}

function rejects() {
  return () => {
    throw new Error('network error')
  }
}

describe('lookupPlayerProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('名前で検索し、メンバーシップIDが一致するプレイヤー情報を返す', async () => {
    stubFetch(fargorateResponse([createFargoRateLookupPlayer()]))

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).resolves.toEqual({
      kind: 'fargorate',
      name: 'Taro Yamada',
      membershipId: MEMBERSHIP_ID,
      location: 'Tokyo',
      rating: 523,
      robustness: 412,
    })
  })

  it('名前をそのまま検索語としてFargoRateへ渡す', async () => {
    const fetchMock = stubFetch(
      fargorateResponse([createFargoRateLookupPlayer()]),
    )

    await lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_LOOKUP_URL)
    expect(options?.query?.q).toBe('Taro Yamada')
  })

  // 同姓同名が返りうるため、メンバーシップIDでの絞り込みが効いていることを確かめる。
  it('同姓同名の候補からメンバーシップIDが一致するものを選ぶ', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({
          membershipId: '9900009999999',
          effectiveRating: '700',
        }),
        createFargoRateLookupPlayer({ effectiveRating: '523' }),
      ]),
    )

    const profile = await lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID)

    expect(profile?.rating).toBe(523)
  })

  it('メンバーシップIDが一致する候補が無ければ null を返す', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({ membershipId: '9900009999999' }),
        createFargoRateLookupPlayer({ membershipId: null }),
      ]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).resolves.toBeNull()
  })

  it('名前の検索に該当が無ければ null を返す', async () => {
    stubFetch(fargorateResponse([]))

    await expect(
      lookupPlayerProfile('Nobody Here', MEMBERSHIP_ID),
    ).resolves.toBeNull()
  })

  // 外部APIの仕様は予告なく変わりうるため、`value` 自体が無い応答も想定する。
  it('応答に value が無くても null を返す', async () => {
    stubFetch({})

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).resolves.toBeNull()
  })

  it('外部APIへ到達できなければ 502 を投げる', async () => {
    stubFetch(rejects())

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  })

  // 「見つからない」（404）と「応答が期待の形でない」（502）を混同しないこと。
  it.each([
    ['空文字', ''],
    ['空白のみ', '   '],
    ['数値として解釈できない文字列', 'unrated'],
    ['無限大', 'Infinity'],
  ])('レーティングが%sなら 502 を投げる', async (_label, effectiveRating) => {
    stubFetch(
      fargorateResponse([createFargoRateLookupPlayer({ effectiveRating })]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).rejects.toMatchObject({
      statusCode: 502,
      statusMessage:
        'The FargoRate membership lookup API returned an unexpected rating',
    })
  })

  it('信頼度が数値として解釈できなければ 502 を投げる', async () => {
    stubFetch(
      fargorateResponse([createFargoRateLookupPlayer({ robustness: '' })]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('レーティングが文字列でなければ 502 を投げる', async () => {
    stubFetch(
      fargorateResponse([
        { ...createFargoRateLookupPlayer(), effectiveRating: 523 } as never,
      ]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('小数のレーティングも数値へ変換する', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({
          effectiveRating: '523.4',
          robustness: '12.5',
        }),
      ]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).resolves.toMatchObject({
      rating: 523.4,
      robustness: 12.5,
    })
  })

  // 名前は検索語ではなくFargoRateの応答の表記を使う。検索は表記の揺れを許すため、
  // 入力した揺れた表記をそのままセッションに残さない。
  it('名前はFargoRateの応答の姓名を結合して作る', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({ firstName: 'TARO', lastName: 'YAMADA' }),
      ]),
    )

    await expect(
      lookupPlayerProfile('taro yamada', MEMBERSHIP_ID),
    ).resolves.toMatchObject({
      name: 'TARO YAMADA',
    })
  })

  // 所在地は空文字で返ることがある。表示側で「値が無い」と扱えるよう null に寄せる。
  it('空文字の所在地を null に寄せる', async () => {
    stubFetch(
      fargorateResponse([createFargoRateLookupPlayer({ location: '' })]),
    )

    await expect(
      lookupPlayerProfile('Taro Yamada', MEMBERSHIP_ID),
    ).resolves.toMatchObject({
      location: null,
    })
  })
})

describe('readMembershipId', () => {
  it('数字だけのメンバーシップIDを取り出す', () => {
    expect(readMembershipId({ membershipId: MEMBERSHIP_ID })).toBe(
      MEMBERSHIP_ID,
    )
  })

  // かつては13桁の固定長としていたが、桁数が一定しないことが判明した。
  it('桁数によらず取り出す', () => {
    expect(readMembershipId({ membershipId: '123' })).toBe('123')
    expect(readMembershipId({ membershipId: '99000012345671234' })).toBe(
      '99000012345671234',
    )
  })

  it.each([
    ['未指定', {}],
    ['null', { membershipId: null }],
    ['数値', { membershipId: 9900001234567 }],
    ['空文字', { membershipId: '' }],
    ['数字以外を含む文字列', { membershipId: '99000012345ab' }],
    ['配列', { membershipId: [MEMBERSHIP_ID] }],
  ])('%sなら 400 を投げる', (_label, body) => {
    expect(() => readMembershipId(body)).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'membershipId must be a string of digits',
      }),
    )
  })

  it('ボディ自体が無くても 400 を投げる', () => {
    expect(() =>
      readMembershipId(undefined as unknown as { membershipId?: unknown }),
    ).toThrowError(expect.objectContaining({ statusCode: 400 }))
  })
})

describe('readPlayerName', () => {
  it('名前を前後の空白を落として取り出す', () => {
    expect(readPlayerName({ name: '  Taro Yamada  ' })).toBe('Taro Yamada')
  })

  it.each([
    ['未指定', {}],
    ['null', { name: null }],
    ['数値', { name: 12 }],
    ['短すぎる文字列', { name: 'a' }],
    ['空白だけの文字列', { name: '   ' }],
    ['長すぎる文字列', { name: 'a'.repeat(65) }],
    ['配列', { name: ['Taro Yamada'] }],
  ])('%sなら 400 を投げる', (_label, body) => {
    expect(() => readPlayerName(body)).toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    )
  })

  it('ボディ自体が無くても 400 を投げる', () => {
    expect(() =>
      readPlayerName(undefined as unknown as { name?: unknown }),
    ).toThrowError(expect.objectContaining({ statusCode: 400 }))
  })
})

describe('searchPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('姓名を結合した検索結果を返す', async () => {
    stubFetch(fargorateResponse([createFargoRateLookupPlayer()]))

    await expect(searchPlayers('Taro Yamada')).resolves.toEqual([
      {
        name: 'Taro Yamada',
        readableId: '1234567',
        membershipId: MEMBERSHIP_ID,
        location: 'Tokyo',
        rating: 523,
        robustness: 412,
      },
    ])
  })

  it('検索語をそのままFargoRateへ渡す', async () => {
    const fetchMock = stubFetch(
      fargorateResponse([createFargoRateLookupPlayer()]),
    )

    await searchPlayers('Taro Yamada')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_LOOKUP_URL)
    expect(options?.query?.q).toBe('Taro Yamada')
  })

  it('ヒットしたぶんだけ複数件を返す', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({ firstName: 'Taro' }),
        createFargoRateLookupPlayer({ firstName: 'Jiro' }),
      ]),
    )

    await expect(searchPlayers('Yamada')).resolves.toHaveLength(2)
  })

  it('該当が無ければ空配列を返す', async () => {
    stubFetch(fargorateResponse([]))

    await expect(searchPlayers('Nobody Here')).resolves.toEqual([])
  })

  /**
   * 読み取れない行が1件混じっただけで一覧全体を落とすと、他が正常でも何も
   * 見せられなくなる。行単位で除いて、読めたものだけを返す。
   */
  it('レーティングが読み取れない行だけを除く', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({ effectiveRating: '' }),
        createFargoRateLookupPlayer({ robustness: 'unknown' }),
        createFargoRateLookupPlayer({ firstName: 'Jiro' }),
      ]),
    )

    const players = await searchPlayers('Yamada')

    expect(players).toHaveLength(1)
    expect(players[0]?.name).toBe('Jiro Yamada')
  })

  // IDを持たないプレイヤーも一覧には出す。除くと件数が合わなくなる。
  it('メンバーシップIDが無いプレイヤーも null のまま返す', async () => {
    stubFetch(
      fargorateResponse([createFargoRateLookupPlayer({ membershipId: null })]),
    )

    const players = await searchPlayers('Yamada')

    expect(players[0]?.membershipId).toBeNull()
  })

  // 「0件」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 を投げる', async () => {
    stubFetch(rejects())

    await expect(searchPlayers('Yamada')).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  })

  it('応答の形が想定と違っても空配列として扱う', async () => {
    stubFetch({})

    await expect(searchPlayers('Yamada')).resolves.toEqual([])
  })

  /**
   * このAPIは姓名のほか `readableId` でも引ける。呼び分けは要らないため、
   * 数字だけの検索語でも同じ経路をそのまま通す。
   */
  it('数字だけの検索語もそのままFargoRateへ渡す', async () => {
    const fetchMock = stubFetch(
      fargorateResponse([createFargoRateLookupPlayer()]),
    )

    await searchPlayers('1234567')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_LOOKUP_URL)
    expect(options?.query?.q).toBe('1234567')
  })

  // 空文字で返ることがあるため、表示側で扱いやすいよう null に寄せる。
  // 一部だけ空文字を許すと、値の有無の判定が項目ごとにぶれる。
  it('空文字で返る項目を null に寄せる', async () => {
    stubFetch(
      fargorateResponse([
        createFargoRateLookupPlayer({
          location: '',
          readableId: '',
          membershipId: '',
        }),
      ]),
    )

    const players = await searchPlayers('Yamada')

    expect(players[0]).toMatchObject({
      location: null,
      readableId: null,
      membershipId: null,
    })
  })
})

describe('readPlayerQuery', () => {
  it('検索語を前後の空白を落として取り出す', () => {
    expect(readPlayerQuery({ query: '  Taro Yamada  ' })).toBe('Taro Yamada')
  })

  it.each([
    ['未指定', {}],
    ['null', { query: null }],
    ['数値', { query: 12 }],
    ['短すぎる文字列', { query: 'a' }],
    ['空白だけの文字列', { query: '   ' }],
    ['長すぎる文字列', { query: 'a'.repeat(65) }],
    ['配列', { query: ['Taro Yamada'] }],
  ])('%sなら 400 を投げる', (_label, body) => {
    expect(() => readPlayerQuery(body)).toThrowError(
      expect.objectContaining({ statusCode: 400 }),
    )
  })

  it('ボディ自体が無くても 400 を投げる', () => {
    expect(() =>
      readPlayerQuery(undefined as unknown as { query?: unknown }),
    ).toThrowError(expect.objectContaining({ statusCode: 400 }))
  })
})
