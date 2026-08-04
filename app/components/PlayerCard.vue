<script setup lang="ts">
/**
 * プレイヤーの `card` 表示に必要な最小限の形。`SessionPlayer` も
 * `FargoRateSearchResult` も構造的にこれを満たすため、型を選ばず渡せる。
 */
type PlayerCardPlayer = {
  name: string | null
  location?: string | null
  rating: number
  robustness?: number
  kind?: 'fargorate' | 'guest'
}

const { player } = defineProps<{ player: PlayerCardPlayer }>()

const { t } = useI18n()

const name = computed(() => player.name ?? t('player.guestName'))

// ゲストの自己申告値には信頼度が無い。項目の有無ではなく kind で判別する。
// kind を持たない検索結果は、FargoRateの応答そのものなので値を信じてよい。
const robustness = computed(() =>
  player.kind !== 'guest' && player.robustness !== undefined
    ? String(player.robustness)
    : t('player.robustnessNone'),
)
</script>

<template>
  <div class="card-body items-center gap-2 p-4 text-center">
    <div class="min-w-0">
      <p class="truncate text-lg font-bold">{{ name }}</p>
      <p v-if="player.location" class="text-base-content/60 mt-0.5 text-xs">
        {{ player.location }}
      </p>
    </div>

    <div class="stats stats-horizontal bg-base-100 w-full">
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary text-2xl">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.robustness') }}</div>
        <div class="stat-value text-2xl">{{ robustness }}</div>
      </div>
    </div>
  </div>
</template>
