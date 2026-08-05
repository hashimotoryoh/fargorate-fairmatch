import { beforeEach, describe, expect, it, vi } from 'vitest'
import { raceOptionsFor } from '../../../server/utils/races'
import { createFargoRateRaces } from '../../helpers/fixtures'

const FARGORATE_RACES_URL =
  'https://lms.fargorate.com/api/ratingcalc/racesbytype'

function stubFetch(response: unknown) {
  const fetchMock = vi.fn().mockResolvedValue(response)
  vi.stubGlobal('$fetch', fetchMock)
  return fetchMock
}

describe('raceOptionsFor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('自分のレーティングが高ければ、自分に高い側のセット数を割り当てる', async () => {
    stubFetch(createFargoRateRaces())

    const options = await raceOptionsFor(576, 419)

    expect(options).toEqual([
      { playerRaceTo: 3, opponentRaceTo: 2, recommended: false },
      { playerRaceTo: 12, opponentRaceTo: 5, recommended: true },
      { playerRaceTo: 13, opponentRaceTo: 6, recommended: false },
    ])
  })

  it('相手のレーティングが高ければ、相手に高い側のセット数を割り当てる', async () => {
    stubFetch(createFargoRateRaces())

    const options = await raceOptionsFor(419, 576)

    expect(options[1]).toEqual({
      playerRaceTo: 5,
      opponentRaceTo: 12,
      recommended: true,
    })
  })

  // レスポンスが high/low の名前で返るため、順序を取り違えると全候補が逆転する。
  it('ratingOne に高い側を渡し、type は常に medium にする', async () => {
    const fetchMock = stubFetch(createFargoRateRaces())

    await raceOptionsFor(419, 576)

    const [url, options] = fetchMock.mock.calls[0]!
    expect(url).toBe(FARGORATE_RACES_URL)
    expect(options?.query).toEqual({ type: 1, ratingOne: 576, ratingTwo: 419 })
  })

  it('候補が0件なら空配列を返す', async () => {
    stubFetch([])

    await expect(raceOptionsFor(500, 500)).resolves.toEqual([])
  })

  it('読み取れない行は行単位で除き、残りを返す', async () => {
    stubFetch([
      { highPlayerRaceTo: '7', lowPlayerRaceTo: 4, delta: 0, closest: false },
      { highPlayerRaceTo: 12, lowPlayerRaceTo: 5, delta: 0, closest: true },
    ])

    await expect(raceOptionsFor(576, 419)).resolves.toEqual([
      { playerRaceTo: 12, opponentRaceTo: 5, recommended: true },
    ])
  })

  it('配列でないレスポンスは 502 として扱う', async () => {
    stubFetch({ value: [] })

    await expect(raceOptionsFor(576, 419)).rejects.toMatchObject({
      statusCode: 502,
    })
  })

  it('外部APIに到達できなければ 502 を投げる', async () => {
    vi.stubGlobal(
      '$fetch',
      vi.fn().mockRejectedValue(new Error('network error')),
    )

    await expect(raceOptionsFor(576, 419)).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate races API',
    })
  })
})
