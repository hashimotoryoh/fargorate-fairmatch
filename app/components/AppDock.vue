<template>
  <!--
    ドックはスマホ幅だけで使う。`sm:hidden` は Tailwind の utilities レイヤー、
    `dock` は daisyUI の components レイヤーなので `!` なしで打ち消せる。
  -->
  <nav class="dock sm:hidden">
    <NuxtLink
      v-for="item in mainNavItems"
      :key="item.to"
      :to="item.to"
      active-class="dock-active"
    >
      <svg
        class="size-5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        aria-hidden="true"
      >
        <path
          v-for="path in item.iconPaths"
          :key="path"
          :d="path"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <span class="dock-label">{{ item.label }}</span>
    </NuxtLink>
  </nav>
</template>
