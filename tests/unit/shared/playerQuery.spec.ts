import { describe, expect, it } from 'vitest'
import {
  PLAYER_QUERY_MAX_LENGTH,
  PLAYER_QUERY_MIN_LENGTH,
  isValidPlayerQuery,
} from '../../../shared/utils/playerQuery'

describe('isValidPlayerQuery', () => {
  it('下限から上限までの長さを受け入れる', () => {
    expect(isValidPlayerQuery('a'.repeat(PLAYER_QUERY_MIN_LENGTH))).toBe(true)
    expect(isValidPlayerQuery('John Doe')).toBe(true)
    expect(isValidPlayerQuery('a'.repeat(PLAYER_QUERY_MAX_LENGTH))).toBe(true)
  })

  // 1文字では候補が広すぎ、非公式APIへ無用な負荷をかける。
  it('下限より短ければ受け入れない', () => {
    expect(isValidPlayerQuery('a'.repeat(PLAYER_QUERY_MIN_LENGTH - 1))).toBe(
      false,
    )
    expect(isValidPlayerQuery('')).toBe(false)
  })

  it('上限より長ければ受け入れない', () => {
    expect(isValidPlayerQuery('a'.repeat(PLAYER_QUERY_MAX_LENGTH + 1))).toBe(
      false,
    )
  })

  // 空白だけの入力を弾くため、長さは前後の空白を除いて数える。
  it('前後の空白は長さに数えない', () => {
    expect(isValidPlayerQuery('   ')).toBe(false)
    expect(
      isValidPlayerQuery(`  ${'a'.repeat(PLAYER_QUERY_MAX_LENGTH)}  `),
    ).toBe(true)
  })
})
