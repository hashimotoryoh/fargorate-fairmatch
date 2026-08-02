<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.news.title'),
  description: () => t('seo.news.description'),
  ogTitle: () => t('seo.news.ogTitle'),
  ogDescription: () => t('seo.news.ogDescription'),
})

const { data: articles } = await useAsyncData(
  () => `news-list:${locale.value}`,
  () =>
    queryCollection(`news_${locale.value}` as 'news_ja')
      .order('date', 'DESC')
      .all(),
  { watch: [locale] },
)
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('news.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('news.lead') }}</p>
    </div>

    <p v-if="!articles?.length" class="text-base-content/70 text-sm">
      {{ $t('news.empty') }}
    </p>

    <ul v-else class="flex flex-col gap-4">
      <li v-for="article in articles" :key="article.path">
        <NuxtLink
          :to="localePath(article.path)"
          class="card bg-base-200 hover:bg-base-300 transition-colors"
        >
          <div class="card-body gap-2">
            <time :datetime="article.date" class="text-base-content/60 text-xs">
              {{ formatLocaleDate(article.date, locale) }}
            </time>
            <h2 class="card-title text-base">{{ article.title }}</h2>
            <p class="text-base-content/70 text-sm">
              {{ article.description }}
            </p>
          </div>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
