import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import guest from '../../../app/middleware/guest'

const { loggedIn, navigateToMock } = vi.hoisted(() => ({
  loggedIn: { value: false },
  navigateToMock: vi.fn((to: unknown) => to),
}))

mockNuxtImport('useUserSession', () => () => ({ loggedIn }))
mockNuxtImport('navigateTo', () => navigateToMock)

const TO = { fullPath: '/lookup' } as RouteLocationNormalized
const FROM = { fullPath: '/' } as RouteLocationNormalized

/**
 * ロケールを切り替える。
 *
 * `setLocale` は自身もそのロケールのURLへの遷移を起こすため、
 * 落ち着かせてから navigateTo の記録を消す。
 */
async function useLocale(code: 'ja' | 'en') {
  await useNuxtApp().$i18n.setLocale(code)
  await flushPromises()
  navigateToMock.mockClear()
}

describe('guest ミドルウェア', () => {
  beforeEach(async () => {
    await useLocale('ja')
    loggedIn.value = false
  })

  it('未認証ならそのまま通す', () => {
    expect(guest(TO, FROM)).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('認証済みならダッシュボードへ送る', () => {
    loggedIn.value = true

    guest(TO, FROM)

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  // 送り先がロケールを落とすと、英語で見ていた人が日本語のページに着く。
  it('英語で見ているときは英語のダッシュボードへ送る', async () => {
    loggedIn.value = true
    await useLocale('en')

    guest(TO, FROM)

    expect(navigateToMock).toHaveBeenCalledWith('/en/dashboard')
  })
})
