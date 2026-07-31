<script setup lang="ts">
const { path } = defineProps<{
  /** 表示するドキュメントのパス。`content/` 直下のファイル名に対応する。 */
  path: string
}>()

// ドキュメントごとにキーを分けないと、別のページの取得結果を使い回してしまう。
const { data: document } = await useAsyncData(`document:${path}`, () =>
  queryCollection('documents').path(path).first(),
)

// 本文はMarkdownにあるため、ファイルを消したり名前を変えたりすると空になる。
// 見出しだけのページを出すよりは、404として扱うほうが気づける。
if (!document.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Document not found',
    fatal: true,
  })
}

useSeoMeta({
  title: document.value.title,
  description: document.value.description,
  ogTitle: `${document.value.title} | FargoRate FairMatch`,
  ogDescription: document.value.description,
})

// フロントマターのISO形式の日付を和暦表記に直す。タイムゾーンを指定しないと
// UTCの0時が前日として表示される環境がある。
const updatedAtLabel = computed(() =>
  new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(document.value!.updatedAt)),
)
</script>

<template>
  <article v-if="document" class="mx-auto w-full max-w-3xl py-4">
    <header class="flex flex-col gap-1">
      <h1 class="text-2xl font-bold">{{ document.title }}</h1>
      <p class="text-base-content/60 text-sm">
        最終更新日:
        <time :datetime="document.updatedAt">{{ updatedAtLabel }}</time>
      </p>
    </header>

    <!-- 本文の見た目は Tailwind Typography の prose に任せる。 -->
    <ContentRenderer :value="document" class="prose max-w-none pt-6" />
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
