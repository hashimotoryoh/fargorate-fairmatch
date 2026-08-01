<script setup lang="ts">
import type { PlayerProfile } from '#shared/types/player'

const { player, showFargorateId = false } = defineProps<{
  player: PlayerProfile
  /**
   * ルックアップの確認画面ではユーザーが今まさに入力したIDなので表示しない。
   * ダッシュボードでは自分のIDを確認する手段として表示する。
   */
  showFargorateId?: boolean
}>()

const rows = computed(() => [
  ...(showFargorateId
    ? [{ key: 'fargorateId', value: player.fargorateId }]
    : []),
  { key: 'name', value: `${player.firstName} ${player.lastName}` },
  { key: 'league', value: player.leagueName },
  { key: 'region', value: player.region },
  { key: 'team', value: player.teamNames },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- レーティングと信頼度はこのアプリの中心的な数値なので独立して見せる。 -->
    <div class="stats stats-horizontal bg-base-200 w-full">
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary">{{ player.effectiveRating }}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.robustness') }}</div>
        <div class="stat-value">{{ player.robustness }}</div>
      </div>
    </div>

    <table class="table">
      <tbody>
        <tr v-for="row in rows" :key="row.key">
          <th class="w-1/3">{{ $t(`player.${row.key}`) }}</th>
          <td>{{ row.value ?? '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
