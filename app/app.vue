<script setup lang="ts">
// サイト全体で共通のメタ。ページ固有のものは各ページの useSeoMeta で足す。
useSeoMeta({
  ogSiteName: 'FargoRate FairMatch',
  ogType: 'website',
  ogLocale: 'ja_JP',
  twitterCard: 'summary_large_image',
})

const { siteUrl } = useRuntimeConfig().public
const route = useRoute()

// 絶対URLを要するメタは、公開URLが分かっているときだけ出す。
// 誤ったドメインを指す canonical は正しいURLより害があるため。
if (siteUrl) {
  useSeoMeta({ ogUrl: () => `${siteUrl}${route.path}` })
  useHead({
    link: [{ rel: 'canonical', href: () => `${siteUrl}${route.path}` }],
  })
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
