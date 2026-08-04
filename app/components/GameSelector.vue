<script setup lang="ts">
import type { GameSlug } from '~/utils/games'

// 選んだあとの行き先はページごとに違う（入口はクエリ付きの遷移、
// ブリーフィングは状態の更新）ため、ここでは選択を伝えるだけにする。
const emit = defineEmits<{ select: [slug: GameSlug] }>()
</script>

<template>
  <div class="flex flex-col gap-3">
    <button
      v-for="game in gameDefinitions"
      :key="game.slug"
      type="button"
      class="card bg-base-200 border-base-300 border text-left transition-colors disabled:opacity-60"
      :class="game.available ? 'hover:border-primary cursor-pointer' : ''"
      :disabled="!game.available"
      @click="emit('select', game.slug)"
    >
      <div class="card-body gap-2 p-4">
        <div class="flex items-center gap-3">
          <Icon :name="game.icon" class="text-primary size-6 shrink-0" />
          <span class="card-title text-base">{{ $t(game.labelKey) }}</span>
          <span v-if="!game.available" class="badge badge-ghost badge-sm">
            {{ $t('games.comingSoon') }}
          </span>
        </div>
        <p class="text-base-content/70 text-sm">
          {{ $t(game.descriptionKey) }}
        </p>
      </div>
    </button>
  </div>
</template>
