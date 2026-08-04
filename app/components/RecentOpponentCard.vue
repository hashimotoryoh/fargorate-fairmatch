<script setup lang="ts">
import type { FargoRatePlayer } from '#shared/types/player'

// 一覧の中で見比べる用途なので、共通のプレイヤーカードより横に詰めた形にする。
const { opponent } = defineProps<{ opponent: FargoRatePlayer }>()

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="card bg-base-200 border-base-300 hover:border-primary w-full border text-left transition-colors"
    @click="emit('select')"
  >
    <div class="card-body flex-row items-center justify-between gap-3 p-3">
      <div class="min-w-0">
        <p class="truncate font-bold">{{ opponent.name }}</p>
        <p
          v-if="opponent.location"
          class="text-base-content/60 mt-0.5 truncate text-xs"
        >
          {{ opponent.location }}
        </p>
      </div>

      <div class="stats stats-horizontal bg-base-100 shrink-0">
        <div class="stat place-items-center px-3 py-1">
          <div class="stat-title text-[10px]">{{ $t('player.rating') }}</div>
          <div class="stat-value text-primary text-lg">
            {{ opponent.rating }}
          </div>
        </div>
        <div class="stat place-items-center px-3 py-1">
          <div class="stat-title text-[10px]">
            {{ $t('player.robustness') }}
          </div>
          <div class="stat-value text-lg">{{ opponent.robustness }}</div>
        </div>
      </div>
    </div>
  </button>
</template>
