/**
 * このアプリで扱うレーティングの範囲。USAPLが公開しているハンディキャップ
 * 計算ツール（https://usaplraceto.azurewebsites.net/）が受け付ける入力レンジに
 * 合わせてある。実在するプレイヤーはこれより狭い範囲に収まるが、公式ツールが
 * 許す値を弾く理由もないため、そのまま採る。
 */
export const RATING_MIN = -90
export const RATING_MAX = 930

// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
export function isValidRating(value: number): boolean {
  return Number.isFinite(value) && value >= RATING_MIN && value <= RATING_MAX
}
