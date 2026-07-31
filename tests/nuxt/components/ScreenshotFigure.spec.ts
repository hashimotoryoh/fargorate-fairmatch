import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ScreenshotFigure, {
  type ScreenshotRect,
} from '../../../app/components/ScreenshotFigure.vue'

/** 原寸 1000x2000 の画像から、中央の 500x400 を切り出す想定。 */
const NATURAL_WIDTH = 1000
const CROP: ScreenshotRect = { x: 250, y: 800, width: 500, height: 400 }

function percent(style: string | undefined, property: string): number {
  const matched = style?.match(
    new RegExp(`(?:^|[;\\s])${property}:\\s*(-?[\\d.]+)%`),
  )

  expect(
    matched,
    `${property} が % で指定されていない: ${style}`,
  ).not.toBeNull()

  return Number(matched?.[1])
}

async function mount(props: Record<string, unknown> = {}) {
  return mountSuspended(ScreenshotFigure, {
    props: {
      src: '/img/fargorate-id-00.png',
      alt: 'FargoRateアプリのホーム画面',
      naturalWidth: NATURAL_WIDTH,
      crop: CROP,
      ...props,
    },
  })
}

describe('ScreenshotFigure', () => {
  it('クロップ範囲の縦横比を枠に与える', async () => {
    const component = await mount()

    expect(component.find('figure').attributes('style')).toContain(
      'aspect-ratio: 500 / 400',
    )
  })

  /**
   * 画像は絶対配置し、幅と位置をすべてクロップ枠に対する割合で与える。
   * 原寸の幅がクロップ幅の2倍なら 200%、左端を 250px ぶん外へ出すなら -50%。
   */
  it('原寸座標のクロップ範囲を割合の指定へ変換する', async () => {
    const component = await mount()
    const style = component.find('img').attributes('style')

    expect(percent(style, 'width')).toBeCloseTo(200)
    expect(percent(style, 'left')).toBeCloseTo(-50)
    expect(percent(style, 'top')).toBeCloseTo(-200)
  })

  it('クロップの原点が原寸の原点と同じなら画像をずらさない', async () => {
    const component = await mount({
      crop: { x: 0, y: 0, width: NATURAL_WIDTH, height: 400 },
    })
    const style = component.find('img').attributes('style')

    expect(percent(style, 'width')).toBeCloseTo(100)
    expect(percent(style, 'left')).toBeCloseTo(0)
    expect(percent(style, 'top')).toBeCloseTo(0)
  })

  // preflight の img { max-width: 100% } に潰されると切り出しが崩れる。
  it('画像の最大幅の制限を外し、遅延読み込みにする', async () => {
    const component = await mount()
    const image = component.find('img')

    expect(image.classes()).toContain('max-w-none')
    expect(image.attributes('loading')).toBe('lazy')
    expect(image.attributes('alt')).toBe('FargoRateアプリのホーム画面')
  })

  it('既定では強調枠を出さない', async () => {
    const component = await mount()

    expect(component.find('.ring-primary').exists()).toBe(false)
  })

  // 強調枠は画像と同じクロップ枠を基準に置く。基準がずれると枠だけが動く。
  it('強調枠をクロップ枠に対する割合で置く', async () => {
    const component = await mount({
      highlight: { x: 300, y: 900, width: 100, height: 40 },
    })
    const style = component.find('.ring-primary').attributes('style')

    expect(percent(style, 'left')).toBeCloseTo(10)
    expect(percent(style, 'top')).toBeCloseTo(25)
    expect(percent(style, 'width')).toBeCloseTo(20)
    expect(percent(style, 'height')).toBeCloseTo(10)
  })

  it('強調枠はクリックを受け取らない', async () => {
    const component = await mount({
      highlight: { x: 300, y: 900, width: 100, height: 40 },
    })

    expect(component.find('.ring-primary').classes()).toContain(
      'pointer-events-none',
    )
  })

  it('番号を与えると強調枠にバッジを添える', async () => {
    const component = await mount({
      highlight: { x: 300, y: 900, width: 100, height: 40 },
      badge: '2',
    })
    const badge = component.find('.badge')

    expect(badge.text()).toBe('2')
    expect(badge.attributes('aria-hidden')).toBe('true')
  })

  it('強調枠が無ければバッジも出さない', async () => {
    const component = await mount({ badge: '2' })

    expect(component.find('.badge').exists()).toBe(false)
  })
})
