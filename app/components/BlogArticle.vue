<script setup lang="ts">
const { path } = defineProps<{
  /** 表示する記事のパス。`/blog/<スラッグ>` の形。 */
  path: string
}>()

const { locale } = useI18n()
const localePath = useLocalePath()
const { siteUrl } = useRuntimeConfig().public

// 記事ごとにキーを分けないと、別の記事の取得結果を使い回してしまう。
// ロケールごとに別の文面なので、キーにもロケールを含める。
const { data: article } = await useAsyncData(
  () => `blog:${locale.value}:${path}`,
  () =>
    queryCollection(`blog_${locale.value}` as 'blog_ja')
      .path(path)
      .first(),
  { watch: [locale] },
)

// 本文はMarkdownにあるため、スラッグを変えたり記事を消したりすると空になる。
// 見出しだけのページを出すよりは、404として扱うほうが気づける。
if (!article.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Blog article not found',
    fatal: true,
  })
}

// 記事固有のOGP画像が無ければサイト共通の既定画像にフォールバックする。
// 本文の見出し画像にも同じ画像を使うため、相対パスを先に確定させる。
const imagePath = computed(() => article.value!.image ?? '/img/ogp.png')

const ogImage = computed(() => {
  if (!siteUrl) {
    return undefined
  }

  return `${siteUrl}${imagePath.value}`
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
            // schema.orgの NewsArticle はGoogle Newsへの掲載を前提とした型で
            // 要件が過剰なため、一般的な記事を表す Article を使う。
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

const publishedAtLabel = computed(() =>
  formatLocaleDate(article.value!.date, locale.value),
)
const updatedAtLabel = computed(() =>
  article.value!.updatedAt
    ? formatLocaleDate(article.value!.updatedAt, locale.value)
    : null,
)
</script>

<template>
  <article v-if="article" class="mx-auto w-full max-w-3xl py-4">
    <NuxtImg
      :src="imagePath"
      :alt="article.title"
      width="1200"
      height="630"
      class="aspect-video w-full rounded-box object-cover"
    />

    <header class="mt-6 flex flex-col gap-1">
      <h1 class="text-2xl font-bold">{{ article.title }}</h1>
      <p class="text-base-content/60 flex flex-wrap gap-x-3 text-sm">
        <span>
          {{ $t('blog.publishedAt') }}
          <time :datetime="article.date">{{ publishedAtLabel }}</time>
        </span>
        <span v-if="updatedAtLabel">
          {{ $t('blog.updatedAt') }}
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
