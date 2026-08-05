import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed } from 'vue'
import AuthenticatedLayout from '../../../app/layouts/authenticated.vue'
import DefaultLayout from '../../../app/layouts/default.vue'

const SLOTS = { default: '<p data-testid="content">ページの中身</p>' }

// mockNuxtImport のファクトリはファイル先頭へ巻き上げられるため、
// 差し替える状態も同じタイミングで用意する必要がある。
const session = vi.hoisted(() => ({ loggedIn: false }))

mockNuxtImport('useUserSession', () => () => ({
  loggedIn: computed(() => session.loggedIn),
}))

describe('default レイアウト', () => {
  beforeEach(() => {
    session.loggedIn = false
  })

  it('ヘッダーとフッターでページの中身を挟む', async () => {
    const component = await mountSuspended(DefaultLayout, { slots: SLOTS })

    expect(component.find('header').exists()).toBe(true)
    expect(component.find('main [data-testid="content"]').exists()).toBe(true)
    expect(component.find('footer').exists()).toBe(true)
  })

  it('未認証ならヘッダーのナビゲーションとFABを出さない', async () => {
    const component = await mountSuspended(DefaultLayout, { slots: SLOTS })

    expect(component.find('header nav').exists()).toBe(false)
    expect(component.find('.fab').exists()).toBe(false)
  })

  // ナビゲーションはレイアウトではなく認証状態で決まる。`/` のような公開ページ
  // でも、認証済みならヘッダーのタブとFABの両方が出る。
  it('認証済みならヘッダーのナビゲーションとFABを出す', async () => {
    session.loggedIn = true

    const component = await mountSuspended(DefaultLayout, { slots: SLOTS })

    expect(component.find('header nav').exists()).toBe(true)
    expect(component.find('.fab').exists()).toBe(true)
  })
})

describe('authenticated レイアウト', () => {
  beforeEach(() => {
    session.loggedIn = true
  })

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
})
