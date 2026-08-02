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

const newsSchema = z.object({
  // 一覧のカードとメタタグに使うため必須にする。
  description: z.string(),
  // 公開日（'YYYY-MM-DD'）。一覧の並び順と表示に使う。
  date: z.string(),
  // 改訂した日。無ければ表示上は公開日をそのまま最終更新として扱う。
  updatedAt: z.string().optional(),
  // 記事固有のOGP画像（`public/` 起点のパス）。無ければサイト共通の既定画像を使う。
  image: z.string().optional(),
})

/**
 * ロケール1つ分のニュース記事のコレクション。
 *
 * `content/<ロケール>/news/**` を対象にし、`prefix: 'news'` で
 * `/news/<スラッグ>` のパスに揃える。ドキュメントと違って複数記事を持つため、
 * スキーマも別に持つ（`updatedAt` が任意で `date` と `image` を追加で持つ）。
 */
function newsCollection(locale: string) {
  return defineCollection({
    type: 'page',
    source: { include: `${locale}/news/**`, prefix: 'news' },
    schema: newsSchema,
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
    /**
     * アップデートやプレスリリースなどのニュース記事。ドキュメントと違って
     * 複数の記事を持つため、`/news` の一覧ページと `/news/<スラッグ>` の
     * 詳細ページに分けて扱う。
     */
    news_ja: newsCollection('ja'),
    news_en: newsCollection('en'),
  },
})
