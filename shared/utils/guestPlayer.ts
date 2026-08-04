import { RATING_MAX, RATING_MIN, isValidRating } from './rating'

/**
 * ゲストが自己申告できるレーティングの範囲。ゲスト固有の制限ではなく、
 * アプリ共通のレーティングの範囲（`shared/utils/rating.ts`）をそのまま使う。
 */
export const GUEST_RATING_MIN = RATING_MIN
export const GUEST_RATING_MAX = RATING_MAX

/** 表示が崩れないための名前の長さの上限。 */
export const GUEST_NAME_MAX_LENGTH = 32

// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
export function isValidGuestRating(value: number): boolean {
  return Number.isInteger(value) && isValidRating(value)
}

export function isValidGuestName(value: string): boolean {
  return value.length <= GUEST_NAME_MAX_LENGTH
}
