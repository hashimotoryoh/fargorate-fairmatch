import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { flushPromises } from '@vue/test-utils'
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

describe('auth ミドルウェア', () => {
  beforeEach(async () => {
    await useLocale('ja')
    loggedIn.value = false
    responseHeader.value = ''
    useResponseHeaderMock.mockReturnValue(responseHeader)
  })

  it('認証済みならそのまま通す', () => {
    loggedIn.value = true

    expect(auth(route('/dashboard'), FROM)).toBeUndefined()
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('未認証ならリンクページへ送る', () => {
    auth(route('/dashboard'), FROM)

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/link',
      query: { redirect: '/dashboard' },
    })
  })

  /**
   * 英語で読んでいた人を日本語のリンクページへ送ると、リンクの手前で
   * 読めない画面に突き当たる。送り先はロケールを保たなければならない。
   */
  it('英語で見ているときは英語のリンクページへ送る', async () => {
    await useLocale('en')

    auth(route('/en/dashboard'), FROM)

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/en/link',
      query: { redirect: '/en/dashboard' },
    })
  })

  // リンクを終えたあとに元のページへ戻せるよう、クエリごと残す。
  it('元の行き先をクエリつきで残す', () => {
    auth(route('/settings?tab=account'), FROM)

    expect(navigateToMock).toHaveBeenCalledWith({
      path: '/link',
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
