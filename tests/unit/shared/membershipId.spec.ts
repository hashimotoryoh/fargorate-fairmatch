import { describe, expect, it } from 'vitest'
import { isValidMembershipId } from '../../../shared/utils/membershipId'

describe('isValidMembershipId', () => {
  it('半角数字だけの値を受け入れる', () => {
    expect(isValidMembershipId('9900006315553')).toBe(true)
    expect(isValidMembershipId('0000000000000')).toBe(true)
  })

  // かつては13桁の固定長としていたが、桁数が一定しないことが判明した。
  // 桁数で弾くと実在のIDを受け付けられなくなる。
  it('桁数によらず受け入れる', () => {
    expect(isValidMembershipId('1')).toBe(true)
    expect(isValidMembershipId('990000631555')).toBe(true)
    expect(isValidMembershipId('99000063155531')).toBe(true)
  })

  it('空文字を弾く', () => {
    expect(isValidMembershipId('')).toBe(false)
  })

  it('数字以外を含む値を弾く', () => {
    expect(isValidMembershipId('99000063155a3')).toBe(false)
    expect(isValidMembershipId('990000-315553')).toBe(false)
    expect(isValidMembershipId('+9900006315553')).toBe(false)
    expect(isValidMembershipId(' 9900006315553')).toBe(false)
    expect(isValidMembershipId('9900006315553 ')).toBe(false)
  })

  it('全角数字を弾く', () => {
    expect(isValidMembershipId('９９００００６３１５５５３')).toBe(false)
  })

  // 正規表現の `$` を `\n` の手前で止めてしまう実装だと、末尾に改行を足した値が
  // 通ってしまう。JavaScriptの `$` は入力末尾のみに一致するため弾ける。
  it('末尾に改行を足した値を弾く', () => {
    expect(isValidMembershipId('9900006315553\n')).toBe(false)
  })
})
