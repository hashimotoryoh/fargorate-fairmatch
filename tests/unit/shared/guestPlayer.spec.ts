import { describe, expect, it } from 'vitest'
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
  isValidGuestName,
  isValidGuestRating,
} from '../../../shared/utils/guestPlayer'

describe('isValidGuestRating', () => {
  it('USAPLの計算ツールと同じ範囲を受け入れる', () => {
    expect(GUEST_RATING_MIN).toBe(-90)
    expect(GUEST_RATING_MAX).toBe(930)
    expect(isValidGuestRating(GUEST_RATING_MIN)).toBe(true)
    expect(isValidGuestRating(GUEST_RATING_MAX)).toBe(true)
    expect(isValidGuestRating(0)).toBe(true)
    expect(isValidGuestRating(450)).toBe(true)
  })

  it('範囲外を弾く', () => {
    expect(isValidGuestRating(GUEST_RATING_MIN - 1)).toBe(false)
    expect(isValidGuestRating(GUEST_RATING_MAX + 1)).toBe(false)
  })

  it('整数でない値を弾く', () => {
    expect(isValidGuestRating(450.5)).toBe(false)
    expect(isValidGuestRating(Number.NaN)).toBe(false)
    expect(isValidGuestRating(Number.POSITIVE_INFINITY)).toBe(false)
  })
})

describe('isValidGuestName', () => {
  it('上限までの長さを受け入れる', () => {
    expect(isValidGuestName('')).toBe(true)
    expect(isValidGuestName('あ'.repeat(GUEST_NAME_MAX_LENGTH))).toBe(true)
  })

  it('上限を超える長さを弾く', () => {
    expect(isValidGuestName('あ'.repeat(GUEST_NAME_MAX_LENGTH + 1))).toBe(false)
  })
})
