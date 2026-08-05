<script setup lang="ts">
// このレイアウトを使うのは認証必須のページだけなので、まとめて noindex にする。
// ページごとに書くより追加漏れが起きない。
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <!--
    下部の余白はFAB（btn-lg + bottom: 1rem）が収まる高さぶん。ページ末尾の
    コンテンツやフッター右下の導線がFABに隠れないようにする。セーフエリアを
    足すのは、iPhone のホームインジケーターの分だけ隠れるのを避けるため。
  -->
  <div
    class="flex min-h-dvh flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0"
  >
    <AppHeader show-nav />

    <main class="container mx-auto w-full flex-1 p-4">
      <slot />
    </main>

    <AppFooter />
    <AppFab />
  </div>
</template>
