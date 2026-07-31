import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import LookupGuideModal from '../../../app/components/LookupGuideModal.vue'

function percent(style: string | undefined, property: string): number {
  const matched = style?.match(
    new RegExp(`(?:^|[;\\s])${property}:\\s*(-?[\\d.]+)%`),
  )

  return Number(matched?.[1])
}

describe('LookupGuideModal', () => {
  it('確認方法を開くきっかけをリンクとして出す', async () => {
    const component = await mountSuspended(LookupGuideModal)
    const trigger = component.find('button')

    expect(trigger.text()).toBe('FargoRate IDの確認方法')
    expect(trigger.attributes('type')).toBe('button')
  })

  it('きっかけを押すとモーダルを開く', async () => {
    const component = await mountSuspended(LookupGuideModal)
    const showModal = vi.fn()
    const dialog = component.find('dialog').element as HTMLDialogElement
    dialog.showModal = showModal

    await component.find('button[type="button"]').trigger('click')

    expect(showModal).toHaveBeenCalledTimes(1)
  })

  it('3つの手順を番号付きで縦に並べる', async () => {
    const component = await mountSuspended(LookupGuideModal)
    const steps = component.findAll('ol > li')

    expect(steps).toHaveLength(3)
    expect(steps.map((step) => step.find('.badge').text())).toEqual([
      '1',
      '2',
      '3',
    ])
    expect(steps[0]?.text()).toContain('左上のメニューを開く')
    expect(steps[1]?.text()).toContain('「プレイヤーカード」を開く')
    expect(steps[2]?.text()).toContain('一番下の13桁の数字を読む')
  })

  it('手順ごとにスクリーンショットと代替テキストを添える', async () => {
    const component = await mountSuspended(LookupGuideModal)
    const images = component.findAll('ol img')

    expect(images.map((image) => image.attributes('src'))).toEqual([
      '/img/fargorate-id-00.png',
      '/img/fargorate-id-01.png',
      '/img/fargorate-id-02.png',
    ])
    for (const image of images) {
      expect(image.attributes('alt')).not.toBe('')
      expect(image.attributes('loading')).toBe('lazy')
    }
  })

  /**
   * 強調枠はクロップ枠の中に収まっていなければならない。はみ出していると
   * 枠だけが切り取られて見えなくなり、どこを見ればよいかが伝わらない。
   */
  it('強調枠がクロップ範囲に収まっている', async () => {
    const component = await mountSuspended(LookupGuideModal)

    for (const highlight of component.findAll('.ring-primary')) {
      const style = highlight.attributes('style')
      const left = percent(style, 'left')
      const top = percent(style, 'top')

      expect(left).toBeGreaterThanOrEqual(0)
      expect(top).toBeGreaterThanOrEqual(0)
      expect(left + percent(style, 'width')).toBeLessThanOrEqual(100)
      expect(top + percent(style, 'height')).toBeLessThanOrEqual(100)
    }
  })

  it('閉じる手段をモーダル内と背景の双方に置く', async () => {
    const component = await mountSuspended(LookupGuideModal)
    const forms = component.findAll('form[method="dialog"]')

    expect(forms).toHaveLength(2)
    expect(component.find('.modal-backdrop').exists()).toBe(true)
  })
})
