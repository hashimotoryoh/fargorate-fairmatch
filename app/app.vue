<script setup lang="ts">
const { siteUrl } = useRuntimeConfig().public

// サイト全体で共通のメタ。ページ固有のものは各ページの useSeoMeta で足す。
// og:locale は言語によって変わるため、後述の useLocaleHead に任せる。
//
// og:image は絶対URLを要するため、canonical や hreflang と同じく siteUrl が
// 分かっているときだけ出す。記事固有の画像を持つページ（ブログ詳細）は
// 自身の useSeoMeta でこの既定値を上書きする。
useSeoMeta({
  // `<title>` と同じ「タイトル - サイト名」に揃える。`%pageTitle` はそのページの
  // title で、空のときは `%separator` ごと落ちてサイト名だけになる。ページ側で
  // og:title を書かないこと。書くと接尾辞の管理が二重になる。
  ogTitle: '%pageTitle %separator %siteName',
  // サイト名は `nuxt.config.ts` の `templateParams` に一本化してある。
  // ここで書き写すと、名前を変えたときに片方だけ古くなる。
  ogSiteName: '%siteName',
  ogType: 'website',
  ogImage: () => (siteUrl ? `${siteUrl}/img/ogp.png` : undefined),
  twitterCard: 'summary_large_image',
  twitterImage: () => (siteUrl ? `${siteUrl}/img/ogp.png` : undefined),
})

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

// 訪問のたびにクッキーの保存期間を延ばす。値を変えていなくても明示的に
// 代入し直さないと、useCookie は変更が無い限り Set-Cookie を送り直さない。
const currentTheme = theme.value
theme.value = currentTheme

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
