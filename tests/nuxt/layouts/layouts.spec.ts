import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import AuthenticatedLayout from '../../../app/layouts/authenticated.vue'
import DefaultLayout from '../../../app/layouts/default.vue'

const SLOTS = { default: '<p data-testid="content">ページの中身</p>' }

describe('default レイアウト', () => {
  it('ヘッダーとフッターでページの中身を挟む', async () => {
    const component = await mountSuspended(DefaultLayout, { slots: SLOTS })

    expect(component.find('header').exists()).toBe(true)
    expect(component.find('main [data-testid="content"]').exists()).toBe(true)
    expect(component.find('footer').exists()).toBe(true)
  })

  // `/` は認証済みでも紹介ページのままにするため、ナビゲーションを出さない。
  it('ヘッダーのナビゲーションとFABを出さない', async () => {
    const component = await mountSuspended(DefaultLayout, { slots: SLOTS })

    expect(component.find('header nav').exists()).toBe(false)
    expect(component.find('.fab').exists()).toBe(false)
  })
})

describe('authenticated レイアウト', () => {
  it('ヘッダーとフッターでページの中身を挟む', async () => {
    const component = await mountSuspended(AuthenticatedLayout, {
      slots: SLOTS,
    })

    expect(component.find('header').exists()).toBe(true)
    expect(component.find('main [data-testid="content"]').exists()).toBe(true)
    expect(component.find('footer').exists()).toBe(true)
  })

  it('ヘッダーのナビゲーションとFABの両方を出す', async () => {
    const component = await mountSuspended(AuthenticatedLayout, {
      slots: SLOTS,
    })

    expect(component.find('header nav').exists()).toBe(true)
    expect(component.find('.fab').exists()).toBe(true)
  })

  /**
   * 保護ページとこのレイアウトが1対1に対応するため、ページごとに書くより
   * 追加漏れが起きない。ページを増やしても noindex が付いてくることを保つ。
   */
  it('noindex をまとめて指定する', async () => {
    await mountSuspended(AuthenticatedLayout, { slots: SLOTS })

    // メタタグの反映は描画フレームまで遅延されるため、DOMに現れるのを待つ。
    await vi.waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]')

      expect(robots?.getAttribute('content')).toBe('noindex, nofollow')
    })
  })

  // FABに隠れないための余白。セーフエリアを足さないと、iPhone のホーム
  // インジケーターの分だけフッター右下の導線が隠れる。
  it('スマホ幅でFABが収まる高さぶんの余白を確保する', async () => {
    const component = await mountSuspended(AuthenticatedLayout, {
      slots: SLOTS,
    })

    expect(component.find('div').classes()).toContain(
      'pb-[calc(4rem+env(safe-area-inset-bottom))]',
    )
    expect(component.find('div').classes()).toContain('sm:pb-0')
  })
})
