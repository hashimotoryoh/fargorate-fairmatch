/**
 * `/llms.txt` にFAQのセクションを足す。
 *
 * `nuxt.config.ts` の `llms.sections` にある `contentCollection` は
 * `type: 'page'` を前提に `path`/`title`/`seo`/`description` 列を選択する
 * （`@nuxt/content` 側の実装）。FAQ（`faq_en`）は個別ページを持たない
 * `type: 'data'` のコレクションでこれらの列を持たないため、そのままでは使えない。
 *
 * FAQは質問と回答がそのままエージェント向けの構造化データになるため、
 * `nuxt.config.ts` に文面を書き写さず、ここでCSVの内容をそのまま
 * 質問ごとのリンク（質問をtitle、回答をdescriptionにする）として組み立てる。
 * リンク先は個別ページを持たないため、全項目で `/en/faq` を指す。
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('llms:generate', async (event, options) => {
    const items = await queryCollection(event, 'faq_en').all()

    // CSVの行順（=表示している順）に揃える。`.all()` は明示的な `order()` を
    // 指定しない限り並び順を保証しないため、`/faq` ページと同じ基準で並べ直す。
    options.sections.push({
      title: 'FAQ',
      links: sortFaqItemsByRow(items).map((item) => ({
        title: item.question,
        description: item.answer,
        href: '/en/faq',
      })),
    })
  })
})
