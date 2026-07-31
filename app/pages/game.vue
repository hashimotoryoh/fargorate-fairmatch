<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.game.title') })

// 種目の識別子だけを持ち、表示名と説明は翻訳ファイルから引く。
const gameTypes = ['9ball', '8ball'] as const

const selectedGameType = ref<(typeof gameTypes)[number] | null>(null)
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('game.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('game.lead') }}</p>
    </div>

    <fieldset class="grid gap-4 sm:grid-cols-2">
      <legend class="sr-only">{{ $t('game.typeLegend') }}</legend>

      <label
        v-for="gameType in gameTypes"
        :key="gameType"
        class="card bg-base-200 border-base-300 cursor-pointer border transition-colors"
        :class="
          selectedGameType === gameType
            ? 'border-primary bg-primary/10'
            : 'hover:border-base-content/30'
        "
      >
        <div class="card-body gap-2">
          <div class="flex items-center gap-3">
            <input
              v-model="selectedGameType"
              class="radio radio-primary"
              type="radio"
              name="gameType"
              :value="gameType"
            />
            <span class="card-title text-base">
              {{ $t(`game.types.${gameType}.label`) }}
            </span>
          </div>
          <p class="text-base-content/70 text-sm">
            {{ $t(`game.types.${gameType}.description`) }}
          </p>
        </div>
      </label>
    </fieldset>

    <!-- 選択後のスコア入力画面は未実装のため、開始はまだ行えない。 -->
    <button class="btn btn-primary" type="button" disabled>
      {{ $t('game.start') }}
    </button>
  </div>
</template>
