import type {
  CsiLookupResponse,
  FargoRateLookupResponse,
  PlayerProfile,
} from '#shared/types/player'

const CSI_LOOKUP_URL = 'https://csibbm.com/Public/_MembershipLookupWeeksPlayed'
const FARGORATE_LOOKUP_URL = 'https://dashboard.fargorate.com/api/indexsearch'

/** FargoRate ID は13桁の数値。 */
export const FARGORATE_ID_PATTERN = /^\d{13}$/

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
async function fetchFargoRatePlayer(fargorateId: string, query: string) {
  const response = await $fetch<FargoRateLookupResponse>(FARGORATE_LOOKUP_URL, {
    query: { q: query },
  })

  return (
    response.value?.find((player) => player.membershipId === fargorateId) ??
    null
  )
}

/**
 * FargoRate IDからプレイヤー情報を引く。
 *
 * CSI側で姓名を引き当て、その姓名でFargoRate側を検索してレーティングを得る。
 * どちらかで該当が無ければ `null` を返す。外部APIとの通信自体に失敗した場合は
 * 「見つからない」と区別するため 502 を投げる。
 */
export async function lookupPlayerProfile(
  fargorateId: string,
): Promise<PlayerProfile | null> {
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
    player = await fetchFargoRatePlayer(
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

  return {
    fargorateId,
    firstName: member.FirstName,
    lastName: member.LastName,
    leagueName: member.LeagueName,
    region: member.Region,
    teamNames: member.TeamNames,
    effectiveRating: Number(player.effectiveRating),
    robustness: Number(player.robustness),
  }
}

/**
 * リクエストボディからFargoRate IDを取り出して検証する。
 * 形式が不正な場合は 400 を投げる。
 */
export function readFargorateId(body: { fargorateId?: unknown }): string {
  const fargorateId = body?.fargorateId

  if (
    typeof fargorateId !== 'string' ||
    !FARGORATE_ID_PATTERN.test(fargorateId)
  ) {
    throw createError({
      statusCode: 400,
      statusMessage: 'fargorateId must be a 13-digit number',
    })
  }

  return fargorateId
}
