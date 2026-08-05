<script setup lang="ts">
const theme = useTheme()

function toggle() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="btn btn-ghost btn-circle btn-sm"
    :aria-pressed="theme === 'light'"
    :aria-label="$t('theme.switchLabel')"
    @click="toggle"
  >
    <!--
      daisyUIのswapはチェックボックスでも切り替えられるが、状態の実体が
      クッキー（useTheme）にあるため、`swap-active` のクラスで制御する。
    -->
    <span
      class="swap swap-rotate"
      :class="{ 'swap-active': theme === 'light' }"
    >
      <Icon name="heroicons:sun" class="swap-on size-5" />
      <Icon name="heroicons:moon" class="swap-off size-5" />
    </span>
  </button>
</template>
