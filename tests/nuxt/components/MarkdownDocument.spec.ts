import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import MarkdownDocument from '../../../app/components/MarkdownDocument.vue'
import { jaMessage } from '../../helpers/i18n'

const { queryCollectionMock, firstMock, createErrorMock, navigateToMock } =
  vi.hoisted(() => {
    const firstMock = vi.fn()

    return {
      firstMock,
      navigateToMock: vi.fn(),
      // `queryCollection('documents_ja').path('/privacy-policy').first()` の連鎖を模す。
      queryCollectionMock: vi.fn(() => ({
        path: vi.fn(() => ({ first: firstMock })),
      })),
      createErrorMock: vi.fn(
        (options: { statusMessage?: string }) =>
          new Error(options.statusMessage),
      ),
    }
  })

mockNuxtImport('queryCollection', () => queryCollectionMock)
mockNuxtImport('createError', () => createErrorMock)
// setLocale はそのロケールのURLへの遷移を起こす。実際に遷移すると、
// 接頭辞のないルートからロケールを判定し直して元に戻ってしまう。
mockNuxtImport('navigateTo', () => navigateToMock)

/** ロケールを切り替え、遷移が落ち着くまで待つ。 */
async function useLocale(code: 'ja' | 'en') {
  await useNuxtApp().$i18n.setLocale(code)
  await flushPromises()
}

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'documents_ja/privacy-policy.md',
    path: '/privacy-policy',
    title: 'プライバシーポリシー',
    description: '扱う情報の説明。',
    updatedAt: '2026-07-31',
    body: { type: 'minimal', value: [['p', {}, '本文の段落。']] },
    ...overrides,
  }
}

describe('MarkdownDocument', () => {
  beforeEach(async () => {
    await useLocale('ja')
    firstMock.mockReset()
    firstMock.mockResolvedValue(createDocument())
    queryCollectionMock.mockClear()
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

    expect(queryCollectionMock).toHaveBeenCalledWith('documents_ja')
    expect(pathMock).toHaveBeenCalledWith('/terms-conditions')
  })

  /**
   * ロケールごとに別のコレクションへ分けている。引き先を間違えると、英語で
   * 開いても日本語の文面が出る。
   */
  it('英語で見ているときは英語のコレクションを引く', async () => {
    await useLocale('en')

    await mountSuspended(MarkdownDocument, {
      props: { path: '/privacy-policy' },
    })

    expect(queryCollectionMock).toHaveBeenCalledWith('documents_en')
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

    expect(component.text()).toContain(jaMessage('document.updatedAt'))
    expect(time.attributes('datetime')).toBe('2026-07-31')
    expect(time.text()).toBe('2026年7月31日')
  })

  // 日付の表記は言語で変わる。ロケールを渡し忘れると日本語のまま固定される。
  it('最終更新日を英語では英語の表記で出す', async () => {
    await useLocale('en')

    const component = await mountSuspended(MarkdownDocument, {
      props: { path: '/privacy-policy' },
    })

    expect(component.find('time').text()).toBe('July 31, 2026')
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
