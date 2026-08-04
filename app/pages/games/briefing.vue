<script setup lang="ts">
import type { GameOpponent } from '~/composables/useGameSetup'
import type { GameSlug } from '~/utils/games'

definePageMeta({ middleware: 'auth', layout: 'game' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.briefing.title') })

const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { setup, hydrated, setGame, setOpponent } = useGameSetup()
const { addRecentOpponent } = useRecentOpponents()

// 完了済みのステップを選び直している間だけ、有無からの自動判定を上書きする。
const manualStep = ref<'game' | 'opponent' | null>(null)
// クエリの取り込みが終わるまで自動遷移を待たせる。
const seeded = ref(false)

onMounted(() => {
  const game = route.query.game
  if (typeof game === 'string') {
    const definition = gameDefinitions.find(
      (candidate) => candidate.slug === game && candidate.available,
    )
    if (definition) setGame(definition.slug)
  }

  const change = route.query.change
  if (change === 'game' || change === 'opponent') {
    manualStep.value = change
  }

  // 種を状態へ移したらURLから落とす。リロードのたびにクエリが再適用され、
  // その後の選択が巻き戻るのを防ぐ。
  if (game !== undefined || change !== undefined) {
    router.replace({ query: {} })
  }

  seeded.value = true
})

// 並びは常にゲーム→対戦プレイヤーで固定し、未了のステップを前から埋める。
const currentStep = computed<'game' | 'opponent'>(
  () => manualStep.value ?? (setup.value.slug ? 'opponent' : 'game'),
)

// 両方決まっていて選び直し中でもなければ、ゲームのブリーフィングへ進む。
watchEffect(() => {
  if (!seeded.value || !hydrated.value || manualStep.value) return

  const { slug, opponent } = setup.value
  if (!slug || !opponent) return

  const definition = gameDefinitions.find(
    (candidate) => candidate.slug === slug,
  )
  if (definition) {
    navigateTo(localePath(definition.briefingPath))
  }
})

function chooseGame(slug: GameSlug) {
  setGame(slug)
  manualStep.value = null
}

function chooseOpponent(opponent: GameOpponent) {
  if (isFargoRatePlayer(opponent)) {
    addRecentOpponent(opponent)
  }
  setOpponent(opponent)
  manualStep.value = null
}

const steps = computed(() => [
  {
    key: 'game' as const,
    labelKey: 'games.briefing.steps.game',
    done: Boolean(setup.value.slug),
    current: currentStep.value === 'game',
  },
  {
    key: 'opponent' as const,
    labelKey: 'games.briefing.steps.opponent',
    done: Boolean(setup.value.opponent),
    current: currentStep.value === 'opponent',
  },
  {
    key: 'setup' as const,
    labelKey: 'games.briefing.steps.setup',
    done: false,
    current: false,
  },
])
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <GameHeader>
      <template #leading>
        <GameExitButton />
      </template>
    </GameHeader>

    <main class="container mx-auto w-full max-w-2xl flex-1 p-4">
      <div class="flex flex-col gap-6">
        <ul class="steps w-full">
          <li
            v-for="step in steps"
            :key="step.key"
            class="step"
            :class="{ 'step-primary': step.done || step.current }"
          >
            <!-- 完了済みのステップはタップで選び直せる。 -->
            <button
              v-if="step.done && !step.current"
              type="button"
              class="cursor-pointer text-xs"
              @click="manualStep = step.key === 'setup' ? null : step.key"
            >
              {{ $t(step.labelKey) }}
            </button>
            <span v-else class="text-xs" :class="{ 'font-bold': step.current }">
              {{ $t(step.labelKey) }}
            </span>
          </li>
        </ul>

        <template v-if="hydrated">
          <div v-if="currentStep === 'game'" class="flex flex-col gap-4">
            <h2 class="text-lg font-bold">
              {{ $t('games.briefing.game.heading') }}
            </h2>
            <GameSelector @select="chooseGame" />
          </div>

          <OpponentSelector v-else @select="chooseOpponent" />
        </template>

        <div v-else class="skeleton h-64 w-full" />
      </div>
    </main>
  </div>
</template>
