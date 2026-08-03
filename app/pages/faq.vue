<script setup lang="ts">
const { t, locale } = useI18n()
const { siteUrl } = useRuntimeConfig().public

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.faq.title'),
  description: () => t('seo.faq.description'),
  ogDescription: () => t('seo.faq.description'),
})

const { data: faqItems } = await useAsyncData(
  () => `faq-list:${locale.value}`,
  () => queryCollection(`faq_${locale.value}` as 'faq_ja').all(),
  { watch: [locale] },
)

const sortedItems = computed(() => sortFaqItemsByRow(faqItems.value ?? []))

const searchQuery = ref('')

const filteredItems = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) {
    return sortedItems.value
  }

  return sortedItems.value.filter(
    (item) =>
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query),
  )
})

// FAQPageの構造化データ。検索の絞り込み状態に関わらず全件を対象にする。
// siteUrl が無い間は NUXT_PUBLIC_SITE_URL が未設定であり、他ページのcanonical
// やOGP画像と同じ理由で出さない。
useHead(() => ({
  script:
    siteUrl && sortedItems.value.length
      ? [
          {
            type: 'application/ld+json',
            innerHTML: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: sortedItems.value.map((item) => ({
                '@type': 'Question',
                name: item.question,
                acceptedAnswer: { '@type': 'Answer', text: item.answer },
              })),
            }),
          },
        ]
      : [],
}))
</script>

<template>
  <div class="mx-auto flex w-full max-w-3xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('faq.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('faq.lead') }}</p>
    </div>

    <label class="input input-bordered flex w-full items-center gap-2">
      <Icon name="mdi:magnify" class="text-base-content/50" />
      <input
        v-model.trim="searchQuery"
        type="search"
        class="grow"
        :placeholder="$t('faq.searchPlaceholder')"
        :aria-label="$t('faq.searchPlaceholder')"
      />
    </label>

    <p v-if="!filteredItems.length" class="text-base-content/70 text-sm">
      {{ $t('faq.empty') }}
    </p>

    <div v-else class="join join-vertical bg-base-200 w-full">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="collapse join-item collapse-arrow border-base-300 border"
      >
        <input type="checkbox" />
        <div class="collapse-title font-semibold">{{ item.question }}</div>
        <div class="collapse-content text-sm">
          <p>{{ item.answer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
