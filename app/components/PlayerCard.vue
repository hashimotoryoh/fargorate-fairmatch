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
const hasRobustness = computed(
  () => player.kind !== 'guest' && player.robustness !== undefined,
)
</script>

<template>
  <div class="card-body items-center gap-2 p-4 text-center">
    <!--
      所在地が無くても詰めず、名前と所在地を合わせた高さの中で名前を中央に置く。
      並べたカード同士で名前やstatの位置が揃わなくなるのを防ぐ。
      2.875rem は名前（text-lg）と所在地（text-xs + mt-0.5）の行の高さの合計。
    -->
    <div
      class="flex min-h-[2.875rem] w-full min-w-0 flex-col items-center justify-center"
    >
      <p class="max-w-full truncate text-lg font-bold">{{ name }}</p>
      <p
        v-if="player.location"
        class="text-base-content/60 mt-0.5 max-w-full truncate text-xs"
      >
        {{ player.location }}
      </p>
    </div>

    <div
      class="stats stats-horizontal w-full bg-transparent [grid-auto-columns:1fr]"
    >
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary text-2xl">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.robustness') }}</div>
        <div
          class="stat-value text-2xl"
          :class="{ 'text-base-content/40': !hasRobustness }"
        >
          {{ hasRobustness ? player.robustness : '-' }}
        </div>
      </div>
    </div>
  </div>
</template>
