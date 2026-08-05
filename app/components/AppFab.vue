<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <!--
    主要ナビゲーションのスピードダイヤル。スマホ幅だけで使い、デスクトップ幅は
    ヘッダーのタブが同じ導線を担う。`sm:hidden` は Tailwind の utilities
    レイヤー、`fab` は daisyUI の components レイヤーなので `!` なしで打ち消せる。
  -->
  <nav class="fab fab-flower sm:hidden">
    <!-- daisyUIのFABはフォーカスの有無で開閉するため、トリガーはボタン扱いのdivにする。 -->
    <div
      tabindex="0"
      role="button"
      class="btn btn-primary btn-circle btn-lg"
      :aria-label="$t('nav.open')"
    >
      <Icon name="heroicons:bars-3" class="size-6" />
    </div>

    <!-- アイコンだけのボタンなので、名称はツールチップと読み上げ用ラベルで補う。 -->
    <div
      v-for="item in mainNavItems"
      :key="item.to"
      class="tooltip"
      :data-tip="$t(item.labelKey)"
    >
      <NuxtLink
        :to="localePath(item.to)"
        class="btn btn-circle btn-lg"
        :aria-label="$t(item.labelKey)"
      >
        <Icon :name="item.icon" class="size-6" />
      </NuxtLink>
    </div>
  </nav>
</template>
