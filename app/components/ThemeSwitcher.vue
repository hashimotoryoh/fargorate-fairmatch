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
    <Icon name="mdi:theme-light-dark" class="size-5" />
  </button>
</template>
