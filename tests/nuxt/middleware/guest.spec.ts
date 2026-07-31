import { mockNuxtImport } from '@nuxt/test-utils/runtime'
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

describe('guest ミドルウェア', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
