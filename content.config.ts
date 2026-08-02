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
 *
 * `include` は `${locale}/*.md` とし、ロケール直下の `.md` だけを対象にする。
 * `*` はディレクトリ区切りをまたがないため、`blog/` のようなサブディレクトリや
 * `faq.csv` のような `.md` 以外のファイルは自動的に対象外になる。コレクションを
 * 増やすたびに `exclude` を書き足す必要がないようにするための書き方。
 */
function documentCollection(locale: string) {
  return defineCollection({
    type: 'page',
    source: { include: `${locale}/*.md`, prefix: '' },
    schema,
  })
}

const blogSchema = z.object({
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
 * ロケール1つ分のブログ記事のコレクション。
 *
 * `content/<ロケール>/blog/**` を対象にし、`prefix: 'blog'` で
 * `/blog/<スラッグ>` のパスに揃える。ドキュメントと違って複数記事を持つため、
 * スキーマも別に持つ（`updatedAt` が任意で `date` と `image` を追加で持つ）。
 */
function blogCollection(locale: string) {
  return defineCollection({
    type: 'page',
    source: { include: `${locale}/blog/**`, prefix: 'blog' },
    schema: blogSchema,
  })
}

const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
})

/**
 * ロケール1つ分のFAQのコレクション。
 *
 * 質問と回答だけの単純な表形式データで、`/faq` に個別ページを持たせる予定も
 * ないため、ページを前提にした `type: 'page'` ではなく `type: 'data'` にする。
 *
 * `include` にワイルドカードを含まない単一のCSVファイルパスを指定すると、
 * ヘッダー行を除く各行が個別アイテムとして展開される（1件1ファイルのYAMLでは
 * 質問を増減するたびにファイルの追加・削除が要るため、行を足すだけで済む
 * CSVを選んだ）。アイテムのIDは `ja/faq.csv#1`, `#2`, ... のように行番号を
 * 持つので、表示順を保持するための列は別途持たせていない。
 */
function faqCollection(locale: string) {
  return defineCollection({
    type: 'data',
    source: { include: `${locale}/faq.csv` },
    schema: faqSchema,
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
     * アップデートやプレスリリースなどのブログ記事。ドキュメントと違って
     * 複数の記事を持つため、`/blog` の一覧ページと `/blog/<スラッグ>` の
     * 詳細ページに分けて扱う。
     */
    blog_ja: blogCollection('ja'),
    blog_en: blogCollection('en'),
    /** よくある質問。`/faq` で全件をアコーディオン表示する。 */
    faq_ja: faqCollection('ja'),
    faq_en: faqCollection('en'),
  },
})
