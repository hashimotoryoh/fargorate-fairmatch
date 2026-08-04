<script setup lang="ts">
import type { ScoringSide } from '~/composables/useFairSingleRace'

definePageMeta({ middleware: 'auth', layout: 'game' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.fairSingleRace.scoreboard.title') })

const localePath = useLocalePath()
const { user } = useUserSession()
const { setup, hydrated: setupHydrated, clearGameSetup } = useGameSetup()
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

// 中断や完了で自分から離れるときは、状態を消した瞬間の誘導を効かせない。
const leaving = ref(false)

// 進行中のマッチが無いまま開かれた場合は、ブリーフィングからやり直す。
watchEffect(() => {
  if (leaving.value || !setupHydrated.value || !matchHydrated.value) return
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

function scoreOf(side: ScoringSide) {
  return side === 0 ? playerScore.value : opponentScore.value
}

function raceToOf(side: ScoringSide) {
  if (!match.value) return 0
  return side === 0 ? match.value.playerRaceTo : match.value.opponentRaceTo
}

const resultDialog = useTemplateRef<HTMLDialogElement>('resultDialog')

// 決着した瞬間に結果を確認させる。「スコアボードに戻る」で閉じたあとは、
// ヘッダー右の「終了」からいつでも開き直せる。
watch(winner, (side) => {
  if (side !== null) {
    resultDialog.value?.showModal()
  }
})

// 推移は最新が右端へ伸びていくので、常に末尾を見せる。
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

// プレイの完了。すべて破棄して、ブリーフィングに入る前のページへ戻す。
async function finishGame() {
  leaving.value = true
  resultDialog.value?.close()
  const returnTo = resolveRedirectPath(setup.value.returnTo, '/games')
  clearGameSetup()
  resetMatch()
  await release()
  await navigateTo(localePath(returnTo))
}

// プレイの中断。スコアだけを捨てて、開始前のゲーム設定へ戻す。
async function interruptGame() {
  leaving.value = true
  resetMatch()
  await release()
  await navigateTo(localePath('/games/fair-single-race/briefing'))
}

onUnmounted(() => {
  release()
})
</script>

<template>
  <!-- 横向きの狭い画面で全体が収まるよう、ページ自体をスクロールさせない。 -->
  <div
    class="flex h-dvh flex-col overflow-hidden select-none [-webkit-tap-highlight-color:transparent]"
  >
    <GameHeader :title="$t('games.types.fairSingleRace.label')">
      <template #leading>
        <GameExitButton
          heading-key="games.header.interruptConfirmHeading"
          lead-key="games.header.interruptConfirmLead"
          @confirm="interruptGame"
        />
      </template>
      <template #actions>
        <!-- 最終スコアの入力後だけ出す。結果の確認からやり直せるように。 -->
        <button
          v-if="winner !== null"
          class="btn btn-primary btn-sm"
          type="button"
          @click="resultDialog?.showModal()"
        >
          {{ $t('games.fairSingleRace.scoreboard.finish') }}
        </button>
      </template>
    </GameHeader>

    <template v-if="match && user && opponent">
      <div
        class="border-base-300 divide-base-300 grid flex-none grid-cols-2 divide-x border-b pl-[env(safe-area-inset-left)]"
      >
        <PlayerCard :player="user" />
        <PlayerCard :player="opponent" />
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
        class="divide-base-300 grid min-h-0 flex-1 grid-cols-2 divide-x pl-[env(safe-area-inset-left)]"
      >
        <div
          v-for="side in [0, 1] as const"
          :key="side"
          class="relative min-w-0"
        >
          <div
            class="pointer-events-none absolute inset-0 grid place-items-center"
          >
            <!-- 分母は必要セット数。あと何セットかを画面から読み取れるようにする。 -->
            <span
              aria-live="polite"
              class="flex items-baseline gap-1 leading-none font-bold tabular-nums"
              :class="{ 'text-success': winner === side }"
            >
              <span class="text-[clamp(4rem,18vmin,8rem)]">
                {{ scoreOf(side) }}
              </span>
              <span
                class="text-base-content/40 text-[clamp(1.5rem,7vmin,3rem)]"
              >
                /{{ raceToOf(side) }}
              </span>
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

        <div class="modal-action items-center justify-between gap-2">
          <!-- 最終スコアを打ち間違えたときに、戻って取り消せるようにする。 -->
          <button
            class="btn btn-ghost"
            type="button"
            @click="resultDialog?.close()"
          >
            {{ $t('games.fairSingleRace.scoreboard.backToBoard') }}
          </button>
          <div class="flex gap-2">
            <button class="btn btn-primary" type="button" @click="startRematch">
              {{ $t('games.fairSingleRace.scoreboard.rematch') }}
            </button>
            <button class="btn" type="button" @click="finishGame">
              {{ $t('games.fairSingleRace.scoreboard.finish') }}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  </div>
</template>
