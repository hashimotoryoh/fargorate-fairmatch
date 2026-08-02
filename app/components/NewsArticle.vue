<script setup lang="ts">
const { path } = defineProps<{
  /** 表示する記事のパス。`/news/<スラッグ>` の形。 */
  path: string
}>()

const { locale } = useI18n()
const localePath = useLocalePath()
const { siteUrl } = useRuntimeConfig().public

// 記事ごとにキーを分けないと、別の記事の取得結果を使い回してしまう。
// ロケールごとに別の文面なので、キーにもロケールを含める。
const { data: article } = await useAsyncData(
  () => `news:${locale.value}:${path}`,
  () =>
    queryCollection(`news_${locale.value}` as 'news_ja')
      .path(path)
      .first(),
  { watch: [locale] },
)

// 本文はMarkdownにあるため、スラッグを変えたり記事を消したりすると空になる。
// 見出しだけのページを出すよりは、404として扱うほうが気づける。
if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'News article not found',
    fatal: true,
  })
}

// 記事固有のOGP画像が無ければサイト共通の既定画像にフォールバックする。
const ogImage = computed(() => {
  if (!siteUrl) {
    return undefined
  }

  return `${siteUrl}${article.value!.image ?? '/img/ogp.png'}`
})

useSeoMeta({
  title: article.value.title,
  description: article.value.description,
  ogTitle: `${article.value.title} | FargoRate FairMatch`,
  ogDescription: article.value.description,
  // 一覧記事はブログ的な更新情報のため、既定の website ではなく article を使う。
  ogType: 'article',
  ogImage: () => ogImage.value,
  twitterImage: () => ogImage.value,
  articlePublishedTime: article.value.date,
  articleModifiedTime: article.value.updatedAt ?? article.value.date,
})

// JSON-LDの絶対URLは siteUrl が分かっているときだけ組める。canonical や
// og:image と同じ理由で、誤ったドメインを埋め込むより出さないほうを選ぶ。
useHead(() => ({
  script: siteUrl
    ? [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            // NewsArticle はGoogle Newsへの掲載を前提とした型で要件が過剰なため、
            // 一般的な記事を表す Article を使う。
            '@type': 'Article',
            headline: article.value!.title,
            description: article.value!.description,
            datePublished: article.value!.date,
            dateModified: article.value!.updatedAt ?? article.value!.date,
            image: ogImage.value,
            author: { '@type': 'Organization', name: 'FargoRate FairMatch' },
            publisher: {
              '@type': 'Organization',
              name: 'FargoRate FairMatch',
            },
            mainEntityOfPage: `${siteUrl}${localePath(path)}`,
          }),
        },
      ]
    : [],
}))

// フロントマターのISO形式の日付を、表示中の言語の表記に直す。タイムゾーンを
// 指定しないと、UTCの0時が前日として表示される環境がある。
function formatDate(value: string) {
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value))
}

const publishedAtLabel = computed(() => formatDate(article.value!.date))
const updatedAtLabel = computed(() =>
  article.value!.updatedAt ? formatDate(article.value!.updatedAt) : null,
)
</script>

<template>
  <article v-if="article" class="mx-auto w-full max-w-3xl py-4">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">{{ article.title }}</h1>
      <p class="text-base-content/60 flex flex-wrap gap-x-3 text-sm">
        <span>
          {{ $t('news.publishedAt') }}
          <time :datetime="article.date">{{ publishedAtLabel }}</time>
        </span>
        <span v-if="updatedAtLabel">
          {{ $t('news.updatedAt') }}
          <time :datetime="article.updatedAt">{{ updatedAtLabel }}</time>
        </span>
      </p>
    </header>

    <!-- 本文の見た目は Tailwind Typography の prose に任せる。 -->
    <ContentRenderer :value="article" class="prose max-w-none pt-6" />
  </article>
</template>

<style scoped>
/*
  Nuxt Content の見出しは、その見出しへのアンカーを兼ねたリンクを内側に持つ。
  prose のリンク装飾がそのまま乗ると見出しが下線付きになるため、見出しの中に
  限って打ち消す。Markdownが生成する要素が相手でユーティリティクラスを
  付けられないため、ここはスコープ付きのスタイルで行う。
*/
.prose :deep(:is(h1, h2, h3, h4) a) {
  color: inherit;
  text-decoration: none;
}
</style>
