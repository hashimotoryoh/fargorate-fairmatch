/**
 * ゲストが自己申告できるレーティングの範囲。USAPLが公開しているハンディキャップ
 * 計算ツール（https://usaplraceto.azurewebsites.net/）が受け付ける入力レンジに
 * 合わせてある。実在するプレイヤーはこれより狭い範囲に収まるが、公式ツールが
 * 許す値を弾く理由もないため、そのまま採る。
 */
export const GUEST_RATING_MIN = -90
export const GUEST_RATING_MAX = 930

/** 表示が崩れないための名前の長さの上限。 */
export const GUEST_NAME_MAX_LENGTH = 32

// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
export function isValidGuestRating(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= GUEST_RATING_MIN &&
    value <= GUEST_RATING_MAX
  )
}

export function isValidGuestName(value: string): boolean {
  return value.length <= GUEST_NAME_MAX_LENGTH
}
