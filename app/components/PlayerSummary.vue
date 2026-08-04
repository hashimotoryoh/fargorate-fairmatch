<script setup lang="ts">
import type { SessionPlayer } from '#shared/types/player'

const { player, raceTo = undefined } = defineProps<{
  player: SessionPlayer
  /** 指定するとスコアボード用に必要セット数のstatを添える。 */
  raceTo?: number
}>()

const { t } = useI18n()

const name = computed(() => player.name ?? t('player.guestName'))

// ゲストの自己申告値には信頼度が無い。項目の有無ではなく kind で判別する。
const robustness = computed(() =>
  isFargoRatePlayer(player)
    ? String(player.robustness)
    : t('player.robustnessNone'),
)
</script>

<template>
  <div class="flex min-w-0 flex-col gap-2">
    <p class="truncate font-bold">{{ name }}</p>

    <div class="stats stats-horizontal bg-base-100 w-full">
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary text-2xl">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center px-3 py-2">
        <div class="stat-title text-xs">{{ $t('player.robustness') }}</div>
        <div class="stat-value text-2xl">{{ robustness }}</div>
      </div>
      <div
        v-if="raceTo !== undefined"
        class="stat place-items-center px-3 py-2"
      >
        <div class="stat-title text-xs">
          {{ $t('games.fairSingleRace.scoreboard.raceTo') }}
        </div>
        <div class="stat-value text-2xl">{{ raceTo }}</div>
      </div>
    </div>
  </div>
</template>
