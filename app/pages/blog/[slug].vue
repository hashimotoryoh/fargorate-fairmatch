<script setup lang="ts">
// 本文は content/*/blog/<slug>.md で管理する。詳細な取得・SEOの処理は
// BlogArticle に任せる。
const route = useRoute()
const slug = route.params.slug as string
</script>

<template>
  <BlogArticle :path="`/blog/${slug}`" />
</template>
