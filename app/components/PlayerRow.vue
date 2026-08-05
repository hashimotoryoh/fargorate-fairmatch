<script setup lang="ts">
/**
 * 一覧の中で見比べるための横型のプレイヤー表示。左に名前と所在地、右に
 * レーティングと信頼度を置く。最近の対戦プレイヤーと検索結果で共用する。
 */
type PlayerRowPlayer = {
  name: string | null
  location?: string | null
  rating: number
  robustness?: number
  kind?: 'fargorate' | 'guest'
}

const { player } = defineProps<{ player: PlayerRowPlayer }>()

const { t } = useI18n()

const name = computed(() => player.name ?? t('player.guestName'))

// ゲストの自己申告値には信頼度が無い。項目の有無ではなく kind で判別する。
const hasRobustness = computed(
  () => player.kind !== 'guest' && player.robustness !== undefined,
)
</script>

<template>
  <div class="card-body flex-row items-center justify-between gap-3 p-3">
    <div class="min-w-0">
      <p class="truncate font-bold">{{ name }}</p>
      <p
        v-if="player.location"
        class="text-base-content/60 mt-0.5 truncate text-xs"
      >
        {{ player.location }}
      </p>
    </div>

    <div
      class="stats stats-horizontal shrink-0 bg-transparent [grid-auto-columns:1fr]"
    >
      <div class="stat place-items-center px-3 py-1">
        <div class="stat-title text-[10px]">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary text-lg">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center px-3 py-1">
        <div class="stat-title text-[10px]">{{ $t('player.robustness') }}</div>
        <div
          class="stat-value text-lg"
          :class="{ 'text-base-content/40': !hasRobustness }"
        >
          {{ hasRobustness ? player.robustness : '-' }}
        </div>
      </div>
    </div>
  </div>
</template>
