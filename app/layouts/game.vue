<script setup lang="ts">
// このレイアウトを使うのは認証必須のゲーム進行ページだけなので、まとめて
// noindex にする。ページごとに書くより追加漏れが起きない。
useSeoMeta({ robots: 'noindex, nofollow' })
</script>

<template>
  <!--
    ゲーム中は対局に集中させるため、共通のヘッダー・フッター・ドックを出さない。
    ヘッダーは右側の内容がページごとに違うため、各ページが GameHeader を置く。
  -->
  <div class="flex min-h-dvh flex-col">
    <slot />
  </div>
</template>
