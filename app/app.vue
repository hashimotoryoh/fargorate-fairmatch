<script setup lang="ts">
// サイト全体で共通のメタ。ページ固有のものは各ページの useSeoMeta で足す。
// og:locale は言語によって変わるため、後述の useLocaleHead に任せる。
useSeoMeta({
  ogSiteName: 'FargoRate FairMatch',
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

const { siteUrl } = useRuntimeConfig().public

// html の lang、hreflang の alternate、canonical、og:url、og:locale をまとめて
// 作る。手書きすると言語を増やすたびに漏れるため、i18n の設定を唯一の出所にする。
//
// 絶対URLを要するものは、公開URLが分かっているときだけ出す。誤ったドメインを
// 指す canonical や hreflang は、無いことより害があるため。lang は絶対URLを
// 要さないので、`seo` を切っても出る。
const i18nHead = useLocaleHead({ seo: Boolean(siteUrl) })

// クッキーに保存したテーマを html の data-theme に反映する。SSR時点から
// 正しい値で描画されるため、ハイドレーション後にテーマが切り替わって
// ちらつくことがない。
const theme = useTheme()

useHead(() => ({
  htmlAttrs: {
    ...(i18nHead.value.htmlAttrs ?? {}),
    'data-theme': theme.value,
  },
  link: i18nHead.value.link ?? [],
  meta: i18nHead.value.meta ?? [],
}))
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
