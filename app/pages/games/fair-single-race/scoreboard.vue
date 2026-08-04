<script setup lang="ts">
import type { ScoringSide } from '~/composables/useFairSingleRace'

definePageMeta({ middleware: 'auth', layout: 'game' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.fairSingleRace.scoreboard.title') })

const localePath = useLocalePath()
const { user } = useUserSession()
const { setup, hydrated: setupHydrated } = useGameSetup()
const {
  match,
  hydrated: matchHydrated,
  addPoint,
  undoPoint,
  playerScore,
  opponentScore,
  winner,
  trail,
  rematch,
  resetMatch,
} = useFairSingleRace()
const { promptVisible, request: requestLandscape, release } = useLandscapeLock()

// 対局中の画面消灯を防ぐ。ページを離れれば解放される。
useWakeLock()

// 進行中のマッチが無いまま開かれた場合は、ブリーフィングからやり直す。
watchEffect(() => {
  if (!setupHydrated.value || !matchHydrated.value) return
  if (
    !match.value ||
    setup.value.slug !== 'fair-single-race' ||
    !setup.value.opponent
  ) {
    navigateTo(localePath('/games/briefing'))
  }
})

const opponent = computed(() => setup.value.opponent)

const playerName = computed(() => user.value?.name ?? t('player.guestName'))
const opponentName = computed(
  () => opponent.value?.name ?? t('player.guestName'),
)

function nameOf(side: ScoringSide) {
  return side === 0 ? playerName.value : opponentName.value
}

const resultDialog = useTemplateRef<HTMLDialogElement>('resultDialog')

// 決着した瞬間に結果を確認させ、以降のタップがスコアへ届かないようにする。
watch(winner, (side) => {
  if (side !== null) {
    resultDialog.value?.showModal()
  }
})

// 遷移は最新が右端へ伸びていくので、常に末尾を見せる。
const trailEl = useTemplateRef<HTMLElement>('trailEl')
watch(
  () => trail.value.length,
  async () => {
    await nextTick()
    trailEl.value?.scrollTo({ left: trailEl.value.scrollWidth })
  },
  { immediate: true },
)

function startRematch() {
  rematch()
  resultDialog.value?.close()
}

async function finishGame() {
  resultDialog.value?.close()
  resetMatch()
  await release()
  await navigateTo(localePath('/games'))
}

onUnmounted(() => {
  release()
})
</script>

<template>
  <!-- 横向きの狭い画面で全体が収まるよう、ページ自体をスクロールさせない。 -->
  <div
    class="flex h-dvh select-none flex-col overflow-hidden [-webkit-tap-highlight-color:transparent]"
  >
    <GameHeader>
      <template #leading>
        <GameExitButton />
      </template>
    </GameHeader>

    <template v-if="match && user && opponent">
      <div
        class="border-base-300 grid flex-none grid-cols-2 divide-x divide-base-300 border-b pl-[env(safe-area-inset-left)]"
      >
        <div class="px-3 py-2">
          <PlayerSummary :player="user" :race-to="match.playerRaceTo" />
        </div>
        <div class="px-3 py-2">
          <PlayerSummary :player="opponent" :race-to="match.opponentRaceTo" />
        </div>
      </div>

      <div
        class="border-base-300 flex flex-none items-center gap-2 border-b px-3 py-1 pl-[max(0.75rem,env(safe-area-inset-left))]"
      >
        <span class="text-base-content/50 flex-none text-xs">
          {{ $t('games.fairSingleRace.scoreboard.trail') }}
        </span>
        <div
          ref="trailEl"
          class="flex flex-1 items-center gap-1.5 overflow-x-auto"
        >
          <span
            v-for="(mark, index) in trail"
            :key="index"
            class="bg-base-200 flex-none rounded-full px-2 font-mono text-xs tabular-nums"
            :class="{ 'bg-base-300 font-bold': index === trail.length - 1 }"
          >
            {{ mark.player }} - {{ mark.opponent }}
          </span>
        </div>
      </div>

      <div
        class="grid min-h-0 flex-1 grid-cols-2 divide-x divide-base-300 pl-[env(safe-area-inset-left)]"
      >
        <div
          v-for="side in [0, 1] as const"
          :key="side"
          class="relative min-w-0"
        >
          <div
            class="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <span
              aria-live="polite"
              class="text-[clamp(4rem,20vmin,9rem)] leading-none font-bold tabular-nums"
              :class="{ 'text-success': winner === side }"
            >
              {{ side === 0 ? playerScore : opponentScore }}
            </span>
          </div>

          <!-- 取り消しは押す機会が少ないため、+1に右2/3を割り当てる。 -->
          <button
            type="button"
            class="text-base-content/30 active:bg-base-200 absolute inset-y-0 left-0 flex w-1/3 touch-manipulation items-end justify-center pb-3 text-xl font-bold"
            :aria-label="
              $t('games.fairSingleRace.scoreboard.decrease', {
                name: nameOf(side),
              })
            "
            @click="undoPoint(side)"
          >
            -
          </button>
          <button
            type="button"
            class="text-base-content/30 active:bg-primary/15 absolute inset-y-0 right-0 flex w-2/3 touch-manipulation items-end justify-center pb-3 text-xl font-bold"
            :aria-label="
              $t('games.fairSingleRace.scoreboard.increase', {
                name: nameOf(side),
              })
            "
            @click="addPoint(side)"
          >
            +
          </button>
        </div>
      </div>
    </template>

    <RotateDevicePrompt v-if="promptVisible" @retry="requestLandscape" />

    <dialog ref="resultDialog" class="modal">
      <div class="modal-box max-w-sm text-center">
        <h2 class="text-lg font-bold">
          {{
            $t('games.fairSingleRace.scoreboard.winner', {
              name: winner !== null ? nameOf(winner) : '',
            })
          }}
        </h2>
        <p class="mt-3 font-mono text-3xl font-bold tabular-nums">
          {{ playerScore }} - {{ opponentScore }}
        </p>

        <div class="modal-action justify-center">
          <button class="btn btn-primary" type="button" @click="startRematch">
            {{ $t('games.fairSingleRace.scoreboard.rematch') }}
          </button>
          <button class="btn" type="button" @click="finishGame">
            {{ $t('games.fairSingleRace.scoreboard.finish') }}
          </button>
        </div>
      </div>
    </dialog>
  </div>
</template>
