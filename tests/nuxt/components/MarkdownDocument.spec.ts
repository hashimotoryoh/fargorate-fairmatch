import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownDocument from '../../../app/components/MarkdownDocument.vue'

const { queryCollectionMock, firstMock, createErrorMock } = vi.hoisted(() => {
  const firstMock = vi.fn()

  return {
    firstMock,
    // `queryCollection('documents').path('/privacy-policy').first()` の連鎖を模す。
    queryCollectionMock: vi.fn(() => ({
      path: vi.fn(() => ({ first: firstMock })),
    })),
    createErrorMock: vi.fn(
      (options: { statusMessage?: string }) => new Error(options.statusMessage),
    ),
  }
})

mockNuxtImport('queryCollection', () => queryCollectionMock)
mockNuxtImport('createError', () => createErrorMock)

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'documents/privacy-policy.md',
    path: '/privacy-policy',
    title: 'プライバシーポリシー',
    description: '扱う情報の説明。',
    updatedAt: '2026-07-31',
    body: { type: 'minimal', value: [['p', {}, '本文の段落。']] },
    ...overrides,
  }
}

describe('MarkdownDocument', () => {
  beforeEach(() => {
    firstMock.mockReset()
    firstMock.mockResolvedValue(createDocument())
  })

  it('フロントマターの見出しとMarkdownの本文を出す', async () => {
    const component = await mountSuspended(MarkdownDocument, {
      props: { path: '/privacy-policy' },
    })

    expect(component.find('h1').text()).toBe('プライバシーポリシー')
    expect(component.text()).toContain('本文の段落。')
  })

  it('渡されたパスのドキュメントを引く', async () => {
    const pathMock = vi.fn(() => ({ first: firstMock }))
    queryCollectionMock.mockReturnValueOnce({ path: pathMock })

    await mountSuspended(MarkdownDocument, {
      props: { path: '/terms-conditions' },
    })

    expect(queryCollectionMock).toHaveBeenCalledWith('documents')
    expect(pathMock).toHaveBeenCalledWith('/terms-conditions')
  })

  /**
   * 日付はISO形式で持ち、表示のときだけ和暦表記に直す。タイムゾーンを
   * 指定しないとUTCの0時が前日として出る環境があるため、日付がずれないことも見る。
   */
  it('最終更新日を日本語の表記で出す', async () => {
    const component = await mountSuspended(MarkdownDocument, {
      props: { path: '/privacy-policy' },
    })
    const time = component.find('time')

    expect(time.attributes('datetime')).toBe('2026-07-31')
    expect(time.text()).toBe('2026年7月31日')
  })

  // 本文は Tailwind Typography の prose に任せている。
  it('本文を prose で囲む', async () => {
    const component = await mountSuspended(MarkdownDocument, {
      props: { path: '/privacy-policy' },
    })

    expect(component.find('.prose').exists()).toBe(true)
  })

  /**
   * Markdownを消したり名前を変えたりすると本文が引けなくなる。見出しだけの
   * 空のページを出すと気づけないため、404として扱う。
   */
  it('ドキュメントが見つからなければ404にする', async () => {
    firstMock.mockResolvedValue(null)

    // useAsyncData の結果はキーごとに使い回されるため、他のテストと別のパスを使う。
    const component = await mountSuspended(MarkdownDocument, {
      props: { path: '/removed' },
    }).catch(() => null)

    expect(createErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, fatal: true }),
    )
    // 見出しだけの中身のないページを出さない。
    expect(component?.find('h1').exists()).not.toBe(true)
  })
})
