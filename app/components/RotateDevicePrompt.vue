<script setup lang="ts">
// 再試行はユーザー操作を起点にしないと fullscreen を要求できないため、
// ロックの試行そのものを親から受け取る。
const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    class="bg-base-300/95 fixed inset-0 z-40 grid place-items-center p-8 text-center"
  >
    <div class="flex max-w-xs flex-col items-center gap-4">
      <Icon
        name="mdi:phone-rotate-landscape"
        class="text-base-content size-14"
      />
      <h2 class="text-lg font-bold">{{ $t('games.rotate.heading') }}</h2>
      <p class="text-base-content/70 text-sm">{{ $t('games.rotate.lead') }}</p>
      <button class="btn btn-primary" type="button" @click="emit('retry')">
        {{ $t('games.rotate.retry') }}
      </button>
    </div>
  </div>
</template>
