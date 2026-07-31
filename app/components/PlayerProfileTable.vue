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
    ? [{ label: 'FargoRate ID', value: player.fargorateId }]
    : []),
  { label: '名前', value: `${player.firstName} ${player.lastName}` },
  { label: 'リーグ', value: player.leagueName },
  { label: 'リージョン', value: player.region },
  { label: 'チーム', value: player.teamNames },
])
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- レーティングと信頼度はこのアプリの中心的な数値なので独立して見せる。 -->
    <div class="stats stats-horizontal bg-base-200 w-full">
      <div class="stat place-items-center">
        <div class="stat-title">レーティング</div>
        <div class="stat-value text-primary">{{ player.effectiveRating }}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">信頼度</div>
        <div class="stat-value">{{ player.robustness }}</div>
      </div>
    </div>

    <table class="table">
      <tbody>
        <tr v-for="row in rows" :key="row.label">
          <th class="w-1/3">{{ row.label }}</th>
          <td>{{ row.value ?? '-' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
