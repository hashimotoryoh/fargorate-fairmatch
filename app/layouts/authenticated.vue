<script setup lang="ts">
// このレイアウトを使うのは認証必須のページだけなので、まとめて noindex にする。
// ページごとに書くより追加漏れが起きない。
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <!--
    min-h-dvh と flex-1 の組み合わせで、コンテンツが短くてもフッターが
    画面の最下部に張り付く。FABに隠れないための余白は AppFab 自身が持つ。
  -->
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main class="container mx-auto w-full flex-1 p-4">
      <slot />
    </main>

    <AppFooter />
    <AppFab />
  </div>
</template>
