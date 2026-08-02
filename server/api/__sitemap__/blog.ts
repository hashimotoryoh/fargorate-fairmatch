// `/blog/[slug]` は動的ルートで、ページのルート定義からはスラッグを列挙
// できない。そのため @nuxtjs/sitemap の動的ソースとしてここで記事のパスを
// 明示的に返す。
//
// 記事は日英を1対1でペアリングしているため、既定ロケール（`blog_ja`）だけを
// 見れば全スラッグを網羅できる。`_i18nTransform: true` を付けることで、
// 通常のページと同じように `@nuxtjs/sitemap` がロケール接頭辞付きのURL
// （`/en/blog/<slug>`）とhreflangの相互参照を自動で組み立てる。
export default defineSitemapEventHandler(async (event) => {
  const articles = await queryCollection(event, 'blog_ja')
    .select('path', 'date', 'updatedAt')
    .all()

  return articles.map((article) => ({
    loc: article.path,
    lastmod: article.updatedAt ?? article.date,
    _i18nTransform: true,
  }))
})
