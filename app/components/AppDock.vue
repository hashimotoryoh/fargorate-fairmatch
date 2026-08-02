<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <!--
    ドックはスマホ幅だけで使う。`sm:hidden` は Tailwind の utilities レイヤー、
    `dock` は daisyUI の components レイヤーなので `!` なしで打ち消せる。
  -->
  <nav class="dock sm:hidden">
    <NuxtLink
      v-for="item in mainNavItems"
      :key="item.to"
      :to="localePath(item.to)"
      active-class="dock-active"
    >
      <Icon :name="item.icon" class="size-5" />
      <span class="dock-label">{{ $t(item.labelKey) }}</span>
    </NuxtLink>
  </nav>
</template>
