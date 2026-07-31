import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  lookupPlayerProfile,
  readFargorateId,
} from '../../../server/utils/lookup'
import {
  FARGORATE_ID,
  createCsiMember,
  createFargoRatePlayer,
} from '../../helpers/fixtures'
import type { CsiMember, FargoRatePlayer } from '../../../shared/types/player'

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

function fargorateResponse(value: FargoRatePlayer[]) {
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
      fargorate: fargorateResponse([createFargoRatePlayer()]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toEqual({
      fargorateId: FARGORATE_ID,
      firstName: 'Taro',
      lastName: 'Yamada',
      leagueName: 'Tokyo League',
      region: 'Kanto',
      teamNames: 'Team Alpha',
      effectiveRating: 523,
      robustness: 412,
    })
  })

  it('CSIをFargoRate IDで検索し、その姓名でFargoRateを検索する', async () => {
    const fetchMock = stubFetch({
      csi: csiResponse([
        createCsiMember({ FirstName: 'Hanako', LastName: 'Suzuki' }),
      ]),
      fargorate: fargorateResponse([createFargoRatePlayer()]),
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
        createFargoRatePlayer({ membershipId: '9900009999999' }),
        createFargoRatePlayer({ membershipId: null }),
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
        createFargoRatePlayer({
          membershipId: '9900009999999',
          effectiveRating: '700',
        }),
        createFargoRatePlayer({ effectiveRating: '523' }),
      ]),
    })

    const profile = await lookupPlayerProfile(FARGORATE_ID)

    expect(profile?.effectiveRating).toBe(523)
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
        createFargoRatePlayer({ effectiveRating }),
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
      fargorate: fargorateResponse([createFargoRatePlayer({ robustness: '' })]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('レーティングが文字列でなければ 502 を投げる', async () => {
    stubFetch({
      csi: csiResponse([createCsiMember()]),
      fargorate: fargorateResponse([
        { ...createFargoRatePlayer(), effectiveRating: 523 } as never,
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
        createFargoRatePlayer({ effectiveRating: '523.4', robustness: '12.5' }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      effectiveRating: 523.4,
      robustness: 12.5,
    })
  })

  it('CSI側の任意項目が null でもそのまま持ち回る', async () => {
    stubFetch({
      csi: csiResponse([
        createCsiMember({ LeagueName: null, Region: null, TeamNames: null }),
      ]),
      fargorate: fargorateResponse([createFargoRatePlayer()]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      leagueName: null,
      region: null,
      teamNames: null,
    })
  })

  // 姓名はCSI側を正とする。FargoRate側は姓名での検索結果であり、表記が揺れうる。
  it('姓名はCSIの値を使う', async () => {
    stubFetch({
      csi: csiResponse([
        createCsiMember({ FirstName: 'Taro', LastName: 'Yamada' }),
      ]),
      fargorate: fargorateResponse([
        createFargoRatePlayer({ firstName: 'TARO', lastName: 'YAMADA' }),
      ]),
    })

    await expect(lookupPlayerProfile(FARGORATE_ID)).resolves.toMatchObject({
      firstName: 'Taro',
      lastName: 'Yamada',
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
