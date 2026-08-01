import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import TermsConditionsPage from '../../../app/pages/terms-conditions.vue'
import { createDocument } from '../../helpers/fixtures'

const { queryCollectionMock } = vi.hoisted(() => ({
  // 引かれたパスをそのまま返し、ページが指すドキュメントが本文に出ることを見る。
  queryCollectionMock: vi.fn(() => ({
    path: (path: string) => ({
      first: () =>
        Promise.resolve(createDocument(path, `${path} のドキュメント`)),
    }),
  })),
}))

mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('利用規約のページ', () => {
  it('terms-conditions のドキュメントの本文を出す', async () => {
    const component = await mountSuspended(TermsConditionsPage)

    expect(component.find('h1').text()).toBe('/terms-conditions のドキュメント')
    expect(component.text()).toContain(
      '/terms-conditions のドキュメントの本文。',
    )
  })
})
