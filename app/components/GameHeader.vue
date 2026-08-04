<script setup lang="ts">
const { title } = defineProps<{
  /** 中央に出す見出し。ブリーフィングでは開始の案内、スコアボードではゲーム名。 */
  title: string
}>()
</script>

<template>
  <!--
    左右のスロットが空でも中央のタイトルがずれないよう、3カラムのグリッドにする。
    z-30 はドック（z-index: 1）より上、モーダル（999）より下に置くための値。
  -->
  <header
    class="bg-base-200 sticky top-0 z-30 grid min-h-14 grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pl-[max(0.5rem,env(safe-area-inset-left))] sm:px-4"
  >
    <div class="justify-self-start">
      <slot name="leading" />
    </div>

    <!-- ゲーム中の誤タップで対局から離脱しないよう、タイトルはリンクにしない。 -->
    <span class="text-sm font-bold sm:text-base">{{ title }}</span>

    <div class="flex items-center gap-2 justify-self-end">
      <slot name="actions" />
    </div>
  </header>
</template>
