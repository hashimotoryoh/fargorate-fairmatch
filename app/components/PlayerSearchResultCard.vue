<script setup lang="ts">
import type { FargoRateSearchResult } from '#shared/types/player'

const { player } = defineProps<{ player: FargoRateSearchResult }>()
</script>

<template>
  <div class="card-body gap-3 p-4">
    <div>
      <p class="font-bold">{{ player.name }}</p>
      <p v-if="player.location" class="text-base-content/60 mt-0.5 text-xs">
        {{ player.location }}
      </p>
    </div>

    <!-- レーティングと信頼度はこのアプリの中心的な数値なので独立して見せる。 -->
    <div class="stats stats-horizontal bg-base-100 w-full">
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.robustness') }}</div>
        <div class="stat-value">{{ player.robustness }}</div>
      </div>
    </div>
  </div>
</template>
