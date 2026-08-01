import { defineCollection, defineContentConfig, z } from '@nuxt/content'

const schema = z.object({
  // `page` 型が備える description は任意項目だが、メタタグに必ず出したい
  // ため必須にする。フロントマターに無ければビルド時に気づける。
  description: z.string(),
  // 改訂した日。ページに「最終更新日」として出す。
  updatedAt: z.string(),
})

/**
 * ロケール1つ分のドキュメントのコレクション。
 *
 * Nuxt Content はコレクションをまたいだ絞り込みを持たないため、ロケールごとに
 * 分ける。`prefix` を空にしてパスからロケールを外し、`/privacy-policy` の形に
 * 揃える。どのロケールを引くかはコレクション名で決まるので、パスまで分ける
 * 必要がない。
 */
function documentCollection(locale: string) {
  return defineCollection({
    type: 'page',
    source: { include: `${locale}/**`, prefix: '' },
    schema,
  })
}

export default defineContentConfig({
  collections: {
    /**
     * Markdownで文面を管理するドキュメント。文面の改訂をコードの変更から
     * 切り離すためのもので、プライバシーポリシーや利用規約がこれにあたる。
     * ファイル名がそのままページのパスになる
     * （`content/ja/privacy-policy.md` なら `/privacy-policy`）ので、
     * `app/pages/` の名前と揃えること。全てのロケールに同じ名前で置く。
     */
    documents_ja: documentCollection('ja'),
    documents_en: documentCollection('en'),
  },
})
