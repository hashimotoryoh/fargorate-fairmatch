import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    /**
     * Markdownで文面を管理するドキュメント。文面の改訂をコードの変更から
     * 切り離すためのもので、プライバシーポリシーや利用規約がこれにあたる。
     * ファイル名がそのままページのパスになる
     * （`content/privacy-policy.md` なら `/privacy-policy`）ので、
     * `app/pages/` の名前と揃えること。
     */
    documents: defineCollection({
      type: 'page',
      source: '*.md',
      schema: z.object({
        // `page` 型が備える description は任意項目だが、メタタグに必ず出したい
        // ため必須にする。フロントマターに無ければビルド時に気づける。
        description: z.string(),
        // 改訂した日。ページに「最終更新日」として出す。
        updatedAt: z.string(),
      }),
    }),
  },
})
