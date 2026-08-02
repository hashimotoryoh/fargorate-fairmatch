import type { GuestPlayer } from '#shared/types/player'

/**
 * リクエストボディからゲストのプレイヤー情報を取り出して検証する。
 *
 * ゲストは名前もレーティングも自己申告であり、FargoRateのように引き直して
 * 裏を取ることができない。せめて混入だけは防ぐため、ボディを展開せず必要な
 * 項目だけを読み、ここで組み立てたオブジェクトをセッションに渡す。
 * これにより `fargorateId` や `kind: 'fargorate'` を送られても効かない。
 */
export function readGuestPlayer(body: {
  name?: unknown
  rating?: unknown
}): GuestPlayer {
  const rating = body?.rating

  if (typeof rating !== 'number' || !isValidGuestRating(rating)) {
    throw createError({
      statusCode: 400,
      statusMessage: `rating must be an integer between ${GUEST_RATING_MIN} and ${GUEST_RATING_MAX}`,
    })
  }

  return { kind: 'guest', name: readGuestName(body?.name), rating }
}

/**
 * 名前は任意。未入力や空白のみは `null` として扱い、表示側で既定名に補う。
 * 既定名は言語によって変わるため、ここで文字列を埋めてしまわない。
 */
function readGuestName(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value !== 'string' || !isValidGuestName(value.trim())) {
    throw createError({
      statusCode: 400,
      statusMessage: `name must be a string of at most ${GUEST_NAME_MAX_LENGTH} characters`,
    })
  }

  return value.trim() || null
}
