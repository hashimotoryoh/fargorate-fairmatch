import type { FargoRateRace, RaceOption } from '#shared/types/race'

const FARGORATE_RACES_URL =
  'https://lms.fargorate.com/api/ratingcalc/racesbytype'

/**
 * レーティングが高い側への厳しさ。0 = mild、1 = medium、2 = hot のうち、
 * このアプリでは常に medium を使う。
 */
const RACE_TYPE_MEDIUM = 1

// 同じレーティングの組み合わせなら結果は決定的なため、長めに保持してよい。
const RACES_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24

function isFargoRateRace(value: unknown): value is FargoRateRace {
  if (typeof value !== 'object' || value === null) return false
  const race = value as Record<string, unknown>

  return (
    typeof race.highPlayerRaceTo === 'number' &&
    typeof race.lowPlayerRaceTo === 'number' &&
    typeof race.delta === 'number' &&
    typeof race.closest === 'boolean'
  )
}

/**
 * FargoRateレースAPIからセット数の候補を取得する。`ratingOne` には高い側を
 * 渡すこと。レスポンスが `high`/`low` で返るため、順序を呼び出し側の解釈に
 * 委ねない。外部APIに到達できなかった場合は 502 を投げる。
 */
async function fetchRacesFresh(
  ratingHigh: number,
  ratingLow: number,
): Promise<FargoRateRace[]> {
  let response: unknown

  try {
    response = await $fetch(FARGORATE_RACES_URL, {
      query: {
        type: RACE_TYPE_MEDIUM,
        ratingOne: ratingHigh,
        ratingTwo: ratingLow,
      },
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate races API',
    })
  }

  if (!Array.isArray(response)) {
    throw createError({
      statusCode: 502,
      statusMessage: 'The FargoRate races API returned an unexpected response',
    })
  }

  // 読み取れない行が混じっても全体は落とさず、行単位で除く。
  return response.filter(isFargoRateRace)
}

// キャッシュはハンドラーではなくこの関数に掛ける。ハンドラーごとキャッシュ
// すると、キャッシュヒット時に requireUserSession が実行されず認証が素通りになる。
export const fetchRaces = defineCachedFunction(fetchRacesFresh, {
  name: 'fargorate-races',
  maxAge: RACES_CACHE_MAX_AGE_SECONDS,
  getKey: (ratingHigh: number, ratingLow: number) =>
    `${ratingHigh}:${ratingLow}`,
})

/**
 * 2人のレーティングから、自分と相手の向きへ正規化したセット数の候補を返す。
 * レーティングが同値の場合はどちらを高い側としても結果は変わらない。
 */
export async function raceOptionsFor(
  playerRating: number,
  opponentRating: number,
): Promise<RaceOption[]> {
  const playerIsHigh = playerRating >= opponentRating
  const races = await fetchRaces(
    Math.max(playerRating, opponentRating),
    Math.min(playerRating, opponentRating),
  )

  return races.map((race) => ({
    playerRaceTo: playerIsHigh ? race.highPlayerRaceTo : race.lowPlayerRaceTo,
    opponentRaceTo: playerIsHigh ? race.lowPlayerRaceTo : race.highPlayerRaceTo,
    recommended: race.closest,
  }))
}

/**
 * クエリパラメータからレーティングを取り出して検証する。
 * 数値として読めないか範囲外の場合は 400 を投げる。
 */
export function readRatingParam(value: unknown, name: string): number {
  const rating =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN

  if (!isValidRating(rating)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${name} must be a number between ${RATING_MIN} and ${RATING_MAX}`,
    })
  }

  return rating
}
