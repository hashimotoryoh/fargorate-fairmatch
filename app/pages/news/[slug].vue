<script setup lang="ts">
// 本文は content/*/news/<slug>.md で管理する。詳細な取得・SEOの処理は
// NewsArticle に任せる。
const route = useRoute()
const slug = route.params.slug as string
</script>

<template>
  <NewsArticle :path="`/news/${slug}`" />
</template>
