import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import auth from '../../../app/middleware/auth'

const { loggedIn, responseHeader, navigateToMock, useResponseHeaderMock } =
  vi.hoisted(() => ({
    loggedIn: { value: false },
    responseHeader: { value: '' },
    navigateToMock: vi.fn((to: unknown) => to),
    useResponseHeaderMock: vi.fn(),
  }))

mockNuxtImport('useUserSession', () => () => ({ loggedIn }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useResponseHeader', () => useResponseHeaderMock)

function route(fullPath: string) {
  return { fullPath } as RouteLocationNormalized
}

const FROM = route('/')

describe('auth ミドルウェア', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    loggedIn.value = false
    responseHeader.value = ''
    useResponseHeaderMock.mockReturnValue(responseHeader)
  })

  it('認証済みならそのまま通す', () => {
    loggedIn.value = true

    expect(auth(route('/dashboard'), FROM)).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('未認証ならルックアップページへ送る', () => {
    auth(route('/dashboard'), FROM)

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/lookup',
      query: { redirect: '/dashboard' },
    })
  })

  // サインインを終えたあとに元のページへ戻せるよう、クエリごと残す。
  it('元の行き先をクエリつきで残す', () => {
    auth(route('/settings?tab=account'), FROM)

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/lookup',
      query: { redirect: '/settings?tab=account' },
    })
  })

  /**
   * レイアウトの noindex メタタグは本文を返す応答にしか乗らないため、
   * 未認証時のリダイレクトをカバーできない。ヘッダーで補う。
   */
  it('認証状態によらず noindex のヘッダーを立てる', () => {
    auth(route('/dashboard'), FROM)

    expect(useResponseHeaderMock).toHaveBeenCalledWith('x-robots-tag')
    expect(responseHeader.value).toBe('noindex, nofollow')

    responseHeader.value = ''
    loggedIn.value = true
    auth(route('/dashboard'), FROM)

    expect(responseHeader.value).toBe('noindex, nofollow')
  })
})
