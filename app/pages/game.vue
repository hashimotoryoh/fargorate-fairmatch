<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

useSeoMeta({ title: 'ゲーム' })

const gameTypes = [
  {
    value: '9ball',
    label: '9ボール',
    description:
      '1番から9番までを順番に落とし、9番を先に落とした方が取得する。',
  },
  {
    value: '8ball',
    label: '8ボール',
    description: '自分の組の7個を落としきってから8番を落とした方が取得する。',
  },
] as const

const selectedGameType = ref<(typeof gameTypes)[number]['value'] | null>(null)
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">ゲーム</h1>
      <p class="text-base-content/70 mt-1 text-sm">
        種目を選んで新しいゲームを始めます。
      </p>
    </div>

    <fieldset class="grid gap-4 sm:grid-cols-2">
      <legend class="sr-only">種目</legend>

      <label
        v-for="gameType in gameTypes"
        :key="gameType.value"
        class="card bg-base-200 border-base-300 cursor-pointer border transition-colors"
        :class="
          selectedGameType === gameType.value
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
              :value="gameType.value"
            />
            <span class="card-title text-base">{{ gameType.label }}</span>
          </div>
          <p class="text-base-content/70 text-sm">{{ gameType.description }}</p>
        </div>
      </label>
    </fieldset>

    <!-- 選択後のスコア入力画面は未実装のため、開始はまだ行えない。 -->
    <button class="btn btn-primary" type="button" disabled>
      ゲームを開始する（準備中）
    </button>
  </div>
</template>
