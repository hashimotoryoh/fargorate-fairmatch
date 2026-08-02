import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ErrorPage from '../../app/error.vue'
import { jaMessage } from '../helpers/i18n'

const { clearErrorMock } = vi.hoisted(() => ({
  clearErrorMock: vi.fn(),
}))

mockNuxtImport('clearError', () => clearErrorMock)

describe('エラーページ', () => {
  beforeEach(() => {
    clearErrorMock.mockClear()
    clearErrorMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    document.cookie = 'theme=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  it('404の場合はページが見つからない旨を示す', async () => {
    const component = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404 } },
    })

    expect(component.text()).toContain(jaMessage('error.notFound.heading'))
    expect(component.text()).toContain(jaMessage('error.notFound.lead'))
    expect(component.text()).toContain('404')
  })

  // 内部のエラーメッセージ（statusMessage・message）は画面に出さない。
  it('404以外は予期しないエラーとして示す', async () => {
    const component = await mountSuspended(ErrorPage, {
      props: {
        error: { statusCode: 500, statusMessage: 'Internal Server Error' },
      },
    })

    expect(component.text()).toContain(jaMessage('error.unexpected.heading'))
    expect(component.text()).toContain(jaMessage('error.unexpected.lead'))
    expect(component.text()).not.toContain('Internal Server Error')
  })

  it('ヘッダーとフッターでページの中身を挟む', async () => {
    const component = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404 } },
    })

    expect(component.find('header').exists()).toBe(true)
    expect(component.find('footer').exists()).toBe(true)
  })

  // 他のページは app.vue の useLocaleHead 経由で lang を BCP47 のタグにしている。
  // error.vue は app.vue を経由しないため、ここで自分で立てた値がずれていないか確かめる。
  it('html の lang を他のページと同じBCP47のタグで出す', async () => {
    await mountSuspended(ErrorPage, { props: { error: { statusCode: 404 } } })

    await vi.waitFor(() => {
      expect(document.documentElement.getAttribute('lang')).toBe('ja-JP')
    })
  })

  // app.vue と同様、選択中のテーマ（クッキー）を html の data-theme に反映する。
  it('選択中のテーマを html の data-theme に反映する', async () => {
    document.cookie = 'theme=light; path=/'

    await mountSuspended(ErrorPage, { props: { error: { statusCode: 404 } } })

    await vi.waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    })
  })

  it('検索エンジンにインデックスさせない', async () => {
    await mountSuspended(ErrorPage, { props: { error: { statusCode: 404 } } })

    await vi.waitFor(() => {
      const robots = document.head.querySelector('meta[name="robots"]')

      expect(robots?.getAttribute('content')).toBe('noindex, nofollow')
    })
  })

  it('ボタンを押すとトップページへのリダイレクト指定でエラーを解消する', async () => {
    const component = await mountSuspended(ErrorPage, {
      props: { error: { statusCode: 404 } },
    })

    // ヘッダーのテーマ切り替えボタンと区別するため、本文（main）内に絞る。
    await component.find('main button').trigger('click')
    await flushPromises()

    expect(clearErrorMock).toHaveBeenCalledWith({ redirect: '/' })
  })
})
