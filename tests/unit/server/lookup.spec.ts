import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  lookupPlayerProfile,
  readFargorateId,
  readPlayerQuery,
  searchPlayers,
} from '../../../server/utils/lookup'
import {
  FARGORATE_ID,
  createCsiMember,
  createFargoRateLookupPlayer,
} from '../../helpers/fixtures'
import type {
  CsiMember,
  FargoRateLookupPlayer,
} from '../../../shared/types/player'

const CSI_LOOKUP_URL = 'https://csibbm.com/Public/_MembershipLookupWeeksPlayed'
const FARGORATE_LOOKUP_URL = 'https://dashboard.fargorate.com/api/indexsearch'

type FetchOptions = { body?: URLSearchParams; query?: { q?: string } }
type MockedResponse = unknown | (() => never)

/**
 * 2つの外部APIをURLで振り分けて模す。
 * 値の代わりに関数を渡すと、その呼び出しで例外を投げる。
 */
function stubFetch(responses: {
  csi?: MockedResponse
  fargorate?: MockedResponse
}) {
  const fetchMock = vi.fn((url: string, _options: FetchOptions = {}) => {
    const response =
      url === CSI_LOOKUP_URL ? responses.csi : responses.fargorate

    if (response === undefined) {
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

function csiResponse(data: CsiMember[]) {
  return { data, total: data.length }
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

  it('CSIとFargoRateの結果を統合したプレイヤー情報を返す', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toEqual({
      kind: 'fargorate',
      name: 'Taro Yamada',
      fargorateId: FARGORATE_ID,
      leagueName: 'Tokyo League',
      region: 'Kanto',
      teamNames: 'Team Alpha',
      rating: 523,
      robustness: 412,
    })
  })

  it('CSIをFargoRate IDで検索し、その姓名でFargoRateを検索する', async () => {
    const fetchMock = stubFetch({
      csi: csiResponse([
        createCsiMember({ FirstName: 'Hanako', LastName: 'Suzuki' }),
      ]),
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await lookupPlayerProfile(FARGORATE_ID)

    const [csiUrl, csiOptions] = fetchMock.mock.calls[0]!
    expect(csiUrl).toBe(CSI_LOOKUP_URL)
    expect(csiOptions?.body?.get('membershipNumber')).toBe(FARGORATE_ID)

    const [fargorateUrl, fargorateOptions] = fetchMock.mock.calls[1]!
    expect(fargorateUrl).toBe(FARGORATE_LOOKUP_URL)
    expect(fargorateOptions?.query?.q).toBe('Hanako Suzuki')
  })

  it('CSIに該当が無ければ null を返し、FargoRateを呼ばない', async () => {
    const fetchMock = stubFetch({ csi: csiResponse([]) })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  // 外部APIの仕様は予告なく変わりうるため、`data` 自体が無い応答も想定する。
  it('CSIの応答に data が無くても null を返す', async () => {
    stubFetch({ csi: {} })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toBeNull()
  })

  it('FargoRateにメンバーシップIDが一致する候補が無ければ null を返す', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ membershipId: '9900009999999' }),
        createFargoRateLookupPlayer({ membershipId: null }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toBeNull()
  })

  it('FargoRateの応答に value が無くても null を返す', async () => {
    stubFetch({ csi: csiResponse([createCsiMember()]), fargorate: {} })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toBeNull()
  })

  // 同姓同名が返りうるため、メンバーシップIDでの絞り込みが効いていることを確かめる。
  it('同姓同名の候補からメンバーシップIDが一致するものを選ぶ', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({
          membershipId: '9900009999999',
          effectiveRating: '700',
        }),
        createFargoRateLookupPlayer({ effectiveRating: '523' }),
      ]),
    })

    const profile = await lookupPlayerProfile(FARGORATE_ID)

    expect(profile?.rating).toBe(523)
  })

  it('CSIへ到達できなければ 502 を投げる', async () => {
    stubFetch({ csi: rejects() })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the CSI membership lookup API',
    })
  })

  it('FargoRateへ到達できなければ 502 を投げる', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: rejects(),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
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
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ effectiveRating }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage:
        'The FargoRate membership lookup API returned an unexpected rating',
    })
  })

  it('信頼度が数値として解釈できなければ 502 を投げる', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ robustness: '' }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('レーティングが文字列でなければ 502 を投げる', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        { ...createFargoRateLookupPlayer(), effectiveRating: 523 } as never,
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('小数のレーティングも数値へ変換する', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({
          effectiveRating: '523.4',
          robustness: '12.5',
        }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      rating: 523.4,
      robustness: 12.5,
    })
  })

  it('CSI側の任意項目が null でもそのまま持ち回る', async () => {
    stubFetch({
      csi: csiResponse([
        createCsiMember({ LeagueName: null, Region: null, TeamNames: null }),
      ]),
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      leagueName: null,
      region: null,
      teamNames: null,
    })
  })

  // 名前はCSI側を正とする。FargoRate側は姓名での検索結果であり、表記が揺れうる。
  it('名前はCSIの姓名を結合して作る', async () => {
    stubFetch({
      csi: csiResponse([
        createCsiMember({ FirstName: 'Taro', LastName: 'Yamada' }),
      ]),
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ firstName: 'TARO', lastName: 'YAMADA' }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      name: 'Taro Yamada',
    })
  })
})

describe('readFargorateId', () => {
  it('13桁のFargoRate IDを取り出す', () => {
    expect(readFargorateId({ fargorateId: FARGORATE_ID })).toBe(FARGORATE_ID)
  })

  it.each([
    ['未指定', {}],
    ['null', { fargorateId: null }],
    ['数値', { fargorateId: 9900001234567 }],
    ['桁数違いの文字列', { fargorateId: '123' }],
    ['数字以外を含む文字列', { fargorateId: '99000012345ab' }],
    ['配列', { fargorateId: [FARGORATE_ID] }],
  ])('%sなら 400 を投げる', (_label, body) => {
    expect(() => readFargorateId(body)).toThrowError(
      expect.objectContaining({
        statusCode: 400,
        statusMessage: 'fargorateId must be a 13-digit number',
      }),
    )
  })

  it('ボディ自体が無くても 400 を投げる', () => {
    expect(() =>
      readFargorateId(undefined as unknown as { fargorateId?: unknown }),
    ).toThrowError(expect.objectContaining({ statusCode: 400 }))
  })
})

describe('searchPlayers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('姓名を結合した検索結果を返す', async () => {
    stubFetch({
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await expect(searchPlayers('Taro Yamada')).resolves.toEqual([
      {
        name: 'Taro Yamada',
        readableId: '1234567',
        fargorateId: FARGORATE_ID,
        location: 'Tokyo',
        rating: 523,
        robustness: 412,
      },
    ])
  })

  // 引くのはFargoRateのAPIだけで、CSIは経由しない。
  it('CSIを呼ばず、検索語をそのままFargoRateへ渡す', async () => {
    const fetchMock = stubFetch({
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await searchPlayers('Taro Yamada')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_LOOKUP_URL)
    expect(options?.query?.q).toBe('Taro Yamada')
  })

  it('ヒットしたぶんだけ複数件を返す', async () => {
    stubFetch({
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ firstName: 'Taro' }),
        createFargoRateLookupPlayer({ firstName: 'Jiro' }),
      ]),
    })

    await expect(searchPlayers('Yamada')).resolves.toHaveLength(2)
  })

  it('該当が無ければ空配列を返す', async () => {
    stubFetch({ fargorate: fargorateResponse([]) })

    await expect(searchPlayers('Nobody Here')).resolves.toEqual([])
  })

  /**
   * 読み取れない行が1件混じっただけで一覧全体を落とすと、他が正常でも何も
   * 見せられなくなる。行単位で除いて、読めたものだけを返す。
   */
  it('レーティングが読み取れない行だけを除く', async () => {
    stubFetch({
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ effectiveRating: '' }),
        createFargoRateLookupPlayer({ robustness: 'unknown' }),
        createFargoRateLookupPlayer({ firstName: 'Jiro' }),
      ]),
    })

    const players = await searchPlayers('Yamada')

    expect(players).toHaveLength(1)
    expect(players[0]?.name).toBe('Jiro Yamada')
  })

  // IDを持たないプレイヤーも一覧には出す。除くと件数が合わなくなる。
  it('メンバーシップIDが無いプレイヤーも null のまま返す', async () => {
    stubFetch({
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ membershipId: null }),
      ]),
    })

    const players = await searchPlayers('Yamada')

    expect(players[0]?.fargorateId).toBeNull()
  })

  // 「0件」と「外部APIに到達できない」を混同しないこと。
  it('外部APIに到達できなければ 502 を投げる', async () => {
    stubFetch({ fargorate: rejects() })

    await expect(searchPlayers('Yamada')).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  })

  it('応答の形が想定と違っても空配列として扱う', async () => {
    stubFetch({ fargorate: {} })

    await expect(searchPlayers('Yamada')).resolves.toEqual([])
  })

  /**
   * このAPIは姓名のほか `readableId` でも引ける。呼び分けは要らないため、
   * 数字だけの検索語でも同じ経路をそのまま通す（CSIは経由しない）。
   */
  it('数字だけの検索語もそのままFargoRateへ渡す', async () => {
    const fetchMock = stubFetch({
      fargorate: fargorateResponse([createFargoRateLookupPlayer()]),
    })

    await searchPlayers('1234567')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_LOOKUP_URL)
    expect(options?.query?.q).toBe('1234567')
  })

  // 空文字で返ることがあるため、表示側で扱いやすいよう null に寄せる。
  it('所在地が空文字なら null にする', async () => {
    stubFetch({
      fargorate: fargorateResponse([
        createFargoRateLookupPlayer({ location: '' }),
      ]),
    })

    const players = await searchPlayers('Yamada')

    expect(players[0]?.location).toBeNull()
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
