import type {
  FargoRateLookupPlayer,
  FargoRateLookupResponse,
  FargoRatePlayer,
  FargoRateSearchResult,
} from '#shared/types/player'

const FARGORATE_LOOKUP_URL = 'https://dashboard.fargorate.com/api/indexsearch'

/**
 * 外部APIの応答を保持する時間。FargoRateのレーティング更新は概ね日次のため、
 * 日をまたいで持ち越さない長さにしてある。
 */
const LOOKUP_CACHE_MAX_AGE_SECONDS = 60 * 60 * 6

/**
 * FargoRateメンバーシップルックアップAPIを検索語で引く。
 * 外部APIに到達できなかった場合は「見つからない」と区別するため 502 を投げる。
 */
async function fetchFargoRateLookupFresh(
  query: string,
): Promise<FargoRateLookupResponse> {
  try {
    return await $fetch<FargoRateLookupResponse>(FARGORATE_LOOKUP_URL, {
      query: { q: query },
    })
  } catch {
    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to reach the FargoRate membership lookup API',
    })
  }
}

/**
 * 同じ検索語の問い合わせを外部へ届かせないためのキャッシュ。ハンドラーごと
 * `defineCachedEventHandler` にするとキャッシュヒット時に認証やreCAPTCHAの
 * 検査が実行されないため、キャッシュは必ずこの関数側に掛ける。
 */
const fetchFargoRateLookup = defineCachedFunction(fetchFargoRateLookupFresh, {
  name: 'fargorate-lookup',
  maxAge: LOOKUP_CACHE_MAX_AGE_SECONDS,
  getKey: (query: string) => query.trim().toLowerCase(),
})

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
 * 名前とメンバーシップIDからプレイヤー情報を引く。
 *
 * FargoRateのAPIはメンバーシップIDでの検索を受け付けないため、名前で検索して
 * 同姓同名を含む候補を得て、メンバーシップIDの一致で1件に絞り込む。一致する
 * 候補が無ければ `null` を返す。外部APIに到達できなかった場合や、期待する形の
 * レスポンスが得られなかった場合は「見つからない」と区別するため 502 を投げる。
 */
export async function lookupPlayerProfile(
  name: string,
  membershipId: string,
): Promise<FargoRatePlayer | null> {
  const response = await fetchFargoRateLookup(name)

  const player =
    response?.value?.find(
      (candidate) => candidate.membershipId === membershipId,
    ) ?? null

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
    // 検索語ではなく応答の表記を使う。検索は大文字小文字などの揺れを許すため。
    name: `${player.firstName} ${player.lastName}`,
    membershipId,
    readableId: player.readableId || null,
    location: player.location || null,
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
    membershipId: player.membershipId || null,
    location: player.location || null,
    rating,
    robustness,
  }
}

/**
 * FargoRateのプレイヤーを検索し、ヒットした全件を返す。
 *
 * `lookupPlayerProfile` がメンバーシップIDの一致で1件に絞るのに対し、こちらは
 * 絞り込まずヒットした全件を返す。
 *
 * 検索語はそのまま `q` に渡す。このAPIは姓名のほか、レスポンスの `readableId`
 * でも引ける（`membershipId` では引けない）。どちらで来ても呼び分けは
 * 要らないため、ここでは判定しない。
 *
 * 読み取れない行が1件混じっただけで一覧全体を落とすと、他が正常でも何も
 * 見せられなくなる。行単位で除いて、読めたものだけを返す。外部APIに到達
 * できなかった場合は「0件」と区別するため 502 を投げる。
 */
export async function searchPlayers(
  query: string,
): Promise<FargoRateSearchResult[]> {
  const response = await fetchFargoRateLookup(query)

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
 * リクエストボディからリンクに使う名前を取り出して検証する。
 * 長さが範囲外の場合は 400 を投げる。前後の空白は落として返す。
 *
 * 名前はFargoRateの検索語としてそのまま使うため、長さの条件はプレイヤー検索の
 * 検索語と同じものを使い、条件を二重に持たない。
 */
export function readPlayerName(body: { name?: unknown }): string {
  const name = body?.name

  if (typeof name !== 'string' || !isValidPlayerQuery(name)) {
    throw createError({
      statusCode: 400,
      statusMessage: `name must be between ${PLAYER_QUERY_MIN_LENGTH} and ${PLAYER_QUERY_MAX_LENGTH} characters`,
    })
  }

  return name.trim()
}

/**
 * リクエストボディからメンバーシップID（UIでいうFargoRate ID）を取り出して
 * 検証する。形式が不正な場合は 400 を投げる。
 *
 * かつては13桁の固定長としていたが、桁数が一定しないことが判明したため、
 * 数字だけで構成されていることのみを確かめる。
 */
export function readMembershipId(body: { membershipId?: unknown }): string {
  const membershipId = body?.membershipId

  if (typeof membershipId !== 'string' || !isValidMembershipId(membershipId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'membershipId must be a string of digits',
    })
  }

  return membershipId
}
