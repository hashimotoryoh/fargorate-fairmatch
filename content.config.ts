import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    /**
     * プライバシーポリシーと利用規約。文面の改訂をコードの変更と切り離すため、
     * 本文はMarkdownで持つ。ファイル名がそのままページのパスになる
     * （`content/privacy.md` なら `/privacy`）ので、`app/pages/` の名前と揃えること。
     */
    legal: defineCollection({
      type: 'page',
      source: '*.md',
      schema: z.object({
        // 改訂した日。ページに「最終更新日」として出す。
        updatedAt: z.string(),
      }),
    }),
  },
})
