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
const { setup, hydrated, startWithGame, setGame, setOpponent, clearGameSetup } =
  useGameSetup()
const { addRecentOpponent } = useRecentOpponents()
const { resetMatch } = useFairSingleRace()

// 完了済みのステップを選び直している間だけ、有無からの自動判定を上書きする。
const manualStep = ref<'game' | 'opponent' | null>(null)
// クエリの取り込みが終わるまで自動遷移を待たせる。
const seeded = ref(false)

onMounted(() => {
  // ゲームの深いリンク（?game=）は入口として扱い、選択を丸ごと作り直す。
  // 前回の対戦相手が残っていると、ステップ2を飛ばして始まってしまう。
  const game = route.query.game
  if (typeof game === 'string') {
    const definition = gameDefinitions.find(
      (candidate) => candidate.slug === game && candidate.available,
    )
    if (definition) startWithGame(definition.slug, null)
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

// ブリーフィングの中断は選択を丸ごと破棄し、入る前のページへ戻す。
async function quitBriefing() {
  const returnTo = resolveRedirectPath(setup.value.returnTo, '/games')
  clearGameSetup()
  resetMatch()
  await navigateTo(localePath(returnTo))
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <GameHeader :title="$t('games.briefing.heading')">
      <template #leading>
        <GameExitButton
          heading-key="games.header.quitConfirmHeading"
          lead-key="games.header.quitConfirmLead"
          @confirm="quitBriefing"
        />
      </template>
    </GameHeader>

    <main class="container mx-auto w-full max-w-2xl flex-1 p-4">
      <div class="flex flex-col gap-6">
        <BriefingSteps :current="currentStep" @change="manualStep = $event" />

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
