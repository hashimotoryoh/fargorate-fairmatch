<script setup lang="ts">
import type { SessionPlayer } from '#shared/types/player'

const { player, showFargorateId = false } = defineProps<{
  player: SessionPlayer
  /**
   * ルックアップの確認画面ではユーザーが今まさに入力したIDなので表示しない。
   * ダッシュボードでは自分のIDを確認する手段として表示する。
   */
  showFargorateId?: boolean
}>()

const { t } = useI18n()

// 名前の既定値は言語で変わるため、セッションには持たせず描画時に補う。
const name = computed(() => player.name ?? t('player.guestName'))

/**
 * 信頼度はレーティングと並ぶ中心的な数値なので、ゲストでも枠は残して
 * 値が無いことを示す。FargoRateの表記に合わせて `None` とする。
 */
const robustness = computed(() =>
  isFargoRatePlayer(player)
    ? String(player.robustness)
    : t('player.robustnessNone'),
)

/**
 * FargoRate固有の項目はゲストには存在しないため、行ごと出さない。
 * 値の無い行を並べても読み手に伝わるものが無い。
 */
const rows = computed(() => {
  if (!isFargoRatePlayer(player)) {
    return [{ key: 'name', value: name.value }]
  }

  return [
    ...(showFargorateId
      ? [{ key: 'fargorateId', value: player.fargorateId }]
      : []),
    { key: 'name', value: name.value },
    { key: 'league', value: player.leagueName },
    { key: 'region', value: player.region },
    { key: 'team', value: player.teamNames },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- レーティングと信頼度はこのアプリの中心的な数値なので独立して見せる。 -->
    <div class="stats stats-horizontal bg-base-200 w-full">
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.rating') }}</div>
        <div class="stat-value text-primary">{{ player.rating }}</div>
      </div>
      <div class="stat place-items-center">
        <div class="stat-title">{{ $t('player.robustness') }}</div>
        <div class="stat-value">{{ robustness }}</div>
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
