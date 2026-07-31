import { describe, expect, it } from 'vitest'
import { isValidFargorateId } from '../../../shared/utils/fargorateId'

describe('isValidFargorateId', () => {
  it('13桁の半角数字を受け入れる', () => {
    expect(isValidFargorateId('9900006315553')).toBe(true)
    expect(isValidFargorateId('0000000000000')).toBe(true)
  })

  it('桁数が13でない値を弾く', () => {
    expect(isValidFargorateId('')).toBe(false)
    expect(isValidFargorateId('990000631555')).toBe(false)
    expect(isValidFargorateId('99000063155531')).toBe(false)
  })

  it('数字以外を含む値を弾く', () => {
    expect(isValidFargorateId('99000063155a3')).toBe(false)
    expect(isValidFargorateId('990000-315553')).toBe(false)
    expect(isValidFargorateId('+990000631555')).toBe(false)
    expect(isValidFargorateId(' 990000631555')).toBe(false)
    expect(isValidFargorateId('990000631555 ')).toBe(false)
  })

  it('全角数字を弾く', () => {
    expect(isValidFargorateId('９９００００６３１５５５３')).toBe(false)
  })

  // 正規表現の `$` を `\n` の手前で止めてしまう実装だと、末尾に改行を足した値が
  // 通ってしまう。JavaScriptの `$` は入力末尾のみに一致するため弾ける。
  it('末尾に改行を足した値を弾く', () => {
    expect(isValidFargorateId('9900006315553\n')).toBe(false)
  })
})
