import type {
  CsiLookupResponse,
  FargoRateLookupResponse,
  FargoRatePlayer,
} from '#shared/types/player'

const CSI_LOOKUP_URL = 'https://csibbm.com/Public/_MembershipLookupWeeksPlayed'
const FARGORATE_LOOKUP_URL = 'https://dashboard.fargorate.com/api/indexsearch'

/**
 * CSIメンバーシップルックアップAPIをFargoRate IDで検索する。
 * IDでの検索なので、ヒットしても最大1件。
 */
async function fetchCsiMember(fargorateId: string) {
  const response = await $fetch<CsiLookupResponse>(CSI_LOOKUP_URL, {
    method: 'POST',
    headers: {
      accept: 'text/plain, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-requested-with': 'XMLHttpRequest',
    },
    body: new URLSearchParams({
      page: '1',
      firstName: '',
      lastName: '',
      membershipNumber: fargorateId,
    }),
    // このAPIは JSON を text/plain として返すため、明示的にパースする。
    parseResponse: JSON.parse,
  })

  return response.data?.[0] ?? null
}

/**
 * FargoRateメンバーシップルックアップAPIを姓名で検索し、
 * メンバーシップIDの一致で1件に絞り込む。
 */
async function fetchFargoRateLookupPlayer(fargorateId: string, query: string) {
  const response = await $fetch<FargoRateLookupResponse>(FARGORATE_LOOKUP_URL, {
    query: { q: query },
  })

  return (
    response.value?.find((player) => player.membershipId === fargorateId) ??
    null
  )
}

/**
 * レーティングは数値ではなく文字列で返るため、数値へ変換する。
 *
 * 外部APIの仕様は予告なく変わりうるので、数値として解釈できない値は弾く。
 * `Number('')` は `NaN` ではなく `0` になるため、空文字は個別に判定している。
 */
function parseRating(value: unknown): number | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null
  }

  const parsed = Number(value)

  return Number.isFinite(parsed) ? parsed : null
}

/**
 * FargoRate IDからプレイヤー情報を引く。
 *
 * CSI側で姓名を引き当て、その姓名でFargoRate側を検索してレーティングを得る。
 * どちらかで該当が無ければ `null` を返す。外部APIに到達できなかった場合や、
 * 期待する形のレスポンスが得られなかった場合は「見つからない」と区別するため
 * 502 を投げる。
 */
export async function lookupPlayerProfile(
  fargorateId: string,
): Promise<FargoRatePlayer | null> {
  let member
  try {
    member = await fetchCsiMember(fargorateId)
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the CSI membership lookup API',
    })
  }

  if (!member) {
    return null
  }

  let player
  try {
    player = await fetchFargoRateLookupPlayer(
      fargorateId,
      `${member.FirstName} ${member.LastName}`,
    )
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  }

  if (!player) {
    return null
  }

  const rating = parseRating(player.effectiveRating)
  const robustness = parseRating(player.robustness)

  if (rating === null || robustness === null) {
    throw createError({
      statusCode: 502,
      statusMessage:
        'The FargoRate membership lookup API returned an unexpected rating',
    })
  }

  return {
    kind: 'fargorate',
    // 姓名の結合はここだけで行い、表示側には結合済みの名前だけを渡す。
    name: `${member.FirstName} ${member.LastName}`,
    fargorateId,
    leagueName: member.LeagueName,
    region: member.Region,
    teamNames: member.TeamNames,
    rating,
    robustness,
  }
}

/**
 * リクエストボディからFargoRate IDを取り出して検証する。
 * 形式が不正な場合は 400 を投げる。
 */
export function readFargorateId(body: { fargorateId?: unknown }): string {
  const fargorateId = body?.fargorateId

  if (typeof fargorateId !== 'string' || !isValidFargorateId(fargorateId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'fargorateId must be a 13-digit number',
    })
  }

  return fargorateId
}
