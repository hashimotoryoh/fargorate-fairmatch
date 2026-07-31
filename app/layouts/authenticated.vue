<script setup lang="ts">
// このレイアウトを使うのは認証必須のページだけなので、まとめて noindex にする。
// ページごとに書くより追加漏れが起きない。
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <!--
    下部の余白はドックの高さぶん。daisyUI のドックは
    `height: calc(4rem + env(safe-area-inset-bottom))` なので、単純な pb-16 だと
    iPhone のホームインジケーターの分だけフッターが隠れる。
  -->
  <div
    class="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0"
  >
    <AppHeader show-nav />

    <main class="container mx-auto w-full flex-1 p-4">
      <slot />
    </main>

    <AppFooter />
    <AppDock />
  </div>
</template>
