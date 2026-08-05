<script setup lang="ts">
type StepKey = 'game' | 'opponent' | 'setup'

const { current } = defineProps<{ current: StepKey }>()

// 選び直しの入り方はページごとに違う（ステップ1・2は画面内の切り替え、
// ステップ3はルートをまたぐ遷移）ため、選択を伝えるだけにする。
const emit = defineEmits<{ change: [step: 'game' | 'opponent'] }>()

const { setup } = useGameSetup()

const steps = computed(() =>
  (
    [
      { key: 'game', done: Boolean(setup.value.slug) },
      { key: 'opponent', done: Boolean(setup.value.opponent) },
      { key: 'setup', done: false },
    ] as const
  ).map((step) => ({
    ...step,
    labelKey: `games.briefing.steps.${step.key}`,
    current: step.key === current,
  })),
)
</script>

<template>
  <ul class="steps w-full">
    <li
      v-for="step in steps"
      :key="step.key"
      class="step"
      :class="{ 'step-primary': step.done || step.current }"
    >
      <!-- 完了済みのステップはタップで選び直せる。 -->
      <button
        v-if="step.done && !step.current && step.key !== 'setup'"
        type="button"
        class="cursor-pointer text-xs"
        @click="emit('change', step.key)"
      >
        {{ $t(step.labelKey) }}
      </button>
      <span v-else class="text-xs" :class="{ 'font-bold': step.current }">
        {{ $t(step.labelKey) }}
      </span>
    </li>
  </ul>
</template>
