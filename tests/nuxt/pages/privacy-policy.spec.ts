import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import PrivacyPolicyPage from '../../../app/pages/privacy-policy.vue'
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

describe('プライバシーポリシーのページ', () => {
  it('privacy-policy のドキュメントの本文を出す', async () => {
    const component = await mountSuspended(PrivacyPolicyPage)

    expect(component.find('h1').text()).toBe('/privacy-policy のドキュメント')
    expect(component.text()).toContain('/privacy-policy のドキュメントの本文。')
  })
})
