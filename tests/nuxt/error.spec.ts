import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
