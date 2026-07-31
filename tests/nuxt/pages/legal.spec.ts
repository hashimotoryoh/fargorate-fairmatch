import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import PrivacyPage from '../../../app/pages/privacy.vue'
import TermsPage from '../../../app/pages/terms.vue'

const { queryCollectionMock } = vi.hoisted(() => ({
  // パスに応じた見出しを返し、ページが正しいドキュメントを引くことを見る。
  queryCollectionMock: vi.fn(() => ({
    path: (path: string) => ({
      first: () =>
        Promise.resolve({
          id: `legal${path}.md`,
          path,
          title: path === '/privacy' ? 'プライバシーポリシー' : '利用規約',
          description: `${path} の説明。`,
          updatedAt: '2026-07-31',
          body: { type: 'minimal', value: [['p', {}, `${path} の本文。`]] },
        }),
    }),
  })),
}))

mockNuxtImport('queryCollection', () => queryCollectionMock)

describe('法的なドキュメントのページ', () => {
  it.each([
    ['プライバシーポリシー', PrivacyPage, '/privacy'],
    ['利用規約', TermsPage, '/terms'],
  ] as const)(
    '%s のページが対応するMarkdownを出す',
    async (title, page, path) => {
      const component = await mountSuspended(page)

      expect(component.find('h1').text()).toBe(title)
      expect(component.text()).toContain(`${path} の本文。`)
    },
  )
})
