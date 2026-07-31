// FargoRate ID は13桁の数値。
// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
const FARGORATE_ID_PATTERN = /^\d{13}$/

export function isValidFargorateId(value: string): boolean {
  return FARGORATE_ID_PATTERN.test(value)
}
