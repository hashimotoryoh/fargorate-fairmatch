import type {
  CsiLookupResponse,
  FargoRateLookupPlayer,
  FargoRateLookupResponse,
  FargoRatePlayer,
  FargoRateSearchResult,
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
 * FargoRateメンバーシップルックアップAPIの1件を、検索結果の形へ変換する。
 * レーティングか信頼度が数値として読めない行は `null` を返して呼び出し側で除く。
 *
 * `location` は空文字で返ることがある。表示側で「値が無い」と扱えるよう、
 * ここで `null` に寄せておく。
 */
function toSearchResult(
  player: FargoRateLookupPlayer,
): FargoRateSearchResult | null {
  const rating = parseRating(player.effectiveRating)
  const robustness = parseRating(player.robustness)

  if (rating === null || robustness === null) {
    return null
  }

  return {
    name: `${player.firstName} ${player.lastName}`,
    readableId: player.readableId || null,
    fargorateId: player.membershipId,
    location: player.location || null,
    rating,
    robustness,
  }
}

/**
 * FargoRateのプレイヤーを検索し、ヒットした全件を返す。
 *
 * `lookupPlayerProfile` と違い、CSIは経由せずFargoRateのAPIだけを引く。
 * したがってリーグ・リージョン・チームは得られない。
 *
 * 検索語はそのまま `q` に渡す。このAPIは姓名のほか、レスポンスの `readableId`
 * でも引ける（13桁の `membershipId` では引けない）。どちらで来ても呼び分けは
 * 要らないため、ここでは判定しない。
 *
 * 読み取れない行が1件混じっただけで一覧全体を落とすと、他が正常でも何も
 * 見せられなくなる。行単位で除いて、読めたものだけを返す。外部APIに到達
 * できなかった場合は「0件」と区別するため 502 を投げる。
 */
export async function searchPlayers(
  query: string,
): Promise<FargoRateSearchResult[]> {
  let response
  try {
    response = await $fetch<FargoRateLookupResponse>(FARGORATE_LOOKUP_URL, {
      query: { q: query },
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  }

  return (response?.value ?? [])
    .map(toSearchResult)
    .filter((player): player is FargoRateSearchResult => player !== null)
}

/**
 * リクエストボディから検索語を取り出して検証する。
 * 長さが範囲外の場合は 400 を投げる。前後の空白は落として返す。
 */
export function readPlayerQuery(body: { query?: unknown }): string {
  const query = body?.query

  if (typeof query !== 'string' || !isValidPlayerQuery(query)) {
    throw createError({
      statusCode: 400,
      statusMessage: `query must be between ${PLAYER_QUERY_MIN_LENGTH} and ${PLAYER_QUERY_MAX_LENGTH} characters`,
    })
  }

  return query.trim()
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
