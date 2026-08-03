// プレイヤー検索の入力の長さ。
// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
export const PLAYER_QUERY_MIN_LENGTH = 2
export const PLAYER_QUERY_MAX_LENGTH = 64

/**
 * 検索語として送ってよい入力かを判定する。
 *
 * 1文字では候補が広すぎて非公式APIへ無用な負荷をかけるため、下限を設ける。
 * 前後の空白は数えない。空白だけの入力を弾くためでもある。
 */
export function isValidPlayerQuery(value: string): boolean {
  const trimmed = value.trim()

  return (
    trimmed.length >= PLAYER_QUERY_MIN_LENGTH &&
    trimmed.length <= PLAYER_QUERY_MAX_LENGTH
  )
}
