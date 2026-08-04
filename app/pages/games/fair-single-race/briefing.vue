<script setup lang="ts">
import type {
  FargoRatePlayer,
  FargoRateSearchResult,
} from '#shared/types/player'
import type { RaceOption } from '#shared/types/race'

definePageMeta({ middleware: 'auth', layout: 'game' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.fairSingleRace.briefing.title') })

const localePath = useLocalePath()
const { user, fetch: refreshSession } = useUserSession()
const { setup, hydrated, setOpponent } = useGameSetup()
const { fetchPlayers } = usePlayerSearch()
const { start } = useFairSingleRace()
const { request: requestLandscape } = useLandscapeLock()

const refreshing = ref(true)
const races = ref<RaceOption[] | null>(null)
const racesFailed = ref(false)
const selected = ref<RaceOption | null>(null)
const showOthers = ref(false)

// このページはフェアセットマッチ専用。状態が揃っていなければ選択からやり直す。
watchEffect(() => {
  if (!hydrated.value) return
  if (setup.value.slug !== 'fair-single-race' || !setup.value.opponent) {
    navigateTo(localePath('/games/briefing'))
  }
})

const opponent = computed(() => setup.value.opponent)

/**
 * 対戦相手のレーティングを引き直す。検索キーには `readableId` を優先し、
 * 見つからなければ名前で探す。どちらのキーで引いても、採用するのは
 * `membershipId` が一致した候補だけにする。
 */
async function refreshOpponent(current: FargoRatePlayer) {
  const matchOf = (results: FargoRateSearchResult[]) =>
    results.find((result) => result.membershipId === current.membershipId) ??
    null

  let matched = matchOf(await fetchPlayers(current.readableId ?? current.name))
  if (!matched && current.readableId) {
    matched = matchOf(await fetchPlayers(current.name))
  }

  if (matched?.membershipId) {
    setOpponent({
      kind: 'fargorate',
      name: matched.name,
      membershipId: matched.membershipId,
      readableId: matched.readableId,
      location: matched.location,
      rating: matched.rating,
      robustness: matched.robustness,
    })
  }
}

// 古い値のまま公平なセット数を算出しないよう、入るたびに両者を引き直す。
// 引き直せなくても既存の値で続行する。外部APIの不調で開始を止めないため。
async function refreshRatings() {
  const current = setup.value.opponent
  const tasks: Promise<unknown>[] = [
    $fetch('/api/auth/refresh', { method: 'POST' }).then(() =>
      refreshSession(),
    ),
  ]

  if (current && isFargoRatePlayer(current)) {
    tasks.push(refreshOpponent(current))
  }

  await Promise.allSettled(tasks)
}

async function loadRaces() {
  const self = user.value
  const other = setup.value.opponent
  if (!self || !other) return

  races.value = null
  racesFailed.value = false

  try {
    const options = await $fetch<RaceOption[]>('/api/races', {
      query: { playerRating: self.rating, opponentRating: other.rating },
    })
    races.value = options
    selected.value =
      options.find((option) => option.recommended) ?? options[0] ?? null
    racesFailed.value = options.length === 0
  } catch {
    racesFailed.value = true
  }
}

async function prepare() {
  refreshing.value = true
  await refreshRatings()
  await loadRaces()
  refreshing.value = false
}

// 状態の復元を待ってから引き直す。
const prepared = ref(false)
watchEffect(() => {
  if (
    hydrated.value &&
    setup.value.slug === 'fair-single-race' &&
    setup.value.opponent &&
    !prepared.value
  ) {
    prepared.value = true
    prepare()
  }
})

function choose(option: RaceOption) {
  selected.value = option
  showOthers.value = false
}

async function play() {
  if (!selected.value) return

  start({
    playerRaceTo: selected.value.playerRaceTo,
    opponentRaceTo: selected.value.opponentRaceTo,
  })
  // fullscreen はユーザー操作の中でしか要求できないため、このタップを起点に
  // 横向きへの切り替えを試みてから遷移する。
  await requestLandscape()
  await navigateTo(localePath('/games/fair-single-race/scoreboard'))
}

async function changePlayer() {
  await navigateTo(
    localePath({ path: '/games/briefing', query: { change: 'opponent' } }),
  )
}
</script>

<template>
  <div class="flex min-h-dvh flex-col">
    <GameHeader>
      <template #leading>
        <GameExitButton />
      </template>
    </GameHeader>

    <main class="container mx-auto w-full max-w-2xl flex-1 p-4">
      <div v-if="refreshing" class="flex flex-col gap-4">
        <div class="skeleton h-8 w-1/2" />
        <div class="skeleton h-28 w-full" />
        <div class="skeleton h-40 w-full" />
      </div>

      <div v-else-if="user && opponent" class="flex flex-col gap-6">
        <span class="badge badge-primary badge-outline">
          {{ $t('games.types.fairSingleRace.label') }}
        </span>

        <div class="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <PlayerSummary :player="user" />
          <span class="text-base-content/50 text-xs font-bold">VS</span>
          <PlayerSummary :player="opponent" />
        </div>

        <div class="flex items-baseline justify-between gap-3">
          <h1 class="text-xl font-bold">
            {{ $t('games.fairSingleRace.briefing.heading') }}
          </h1>
          <button
            class="link link-primary text-sm"
            type="button"
            @click="changePlayer"
          >
            {{ $t('games.fairSingleRace.briefing.changePlayer') }}
          </button>
        </div>

        <div v-if="racesFailed" class="flex flex-col gap-3">
          <div role="alert" class="alert alert-error">
            {{ $t('games.fairSingleRace.briefing.racesUnavailable') }}
          </div>
          <button class="btn" type="button" @click="loadRaces">
            {{ $t('games.fairSingleRace.briefing.retry') }}
          </button>
        </div>

        <template v-else-if="selected">
          <!-- おすすめを大きく1件だけ見せ、他の候補は求められたときだけ出す。 -->
          <div class="card border-primary bg-base-200 border">
            <div class="card-body items-center gap-2 p-4">
              <span
                v-if="selected.recommended"
                class="text-warning flex items-center gap-1 text-xs font-bold"
              >
                <Icon name="mdi:fire" class="size-4" />
                {{ $t('games.fairSingleRace.briefing.recommended') }}
              </span>

              <div
                class="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-3"
              >
                <div class="flex min-w-0 flex-col items-center">
                  <span class="text-4xl font-bold tabular-nums">
                    {{ selected.playerRaceTo }}
                  </span>
                  <span
                    class="text-base-content/60 max-w-full truncate text-xs"
                  >
                    {{ user.name ?? $t('player.guestName') }}
                  </span>
                </div>
                <span class="text-base-content/50 text-xl">-</span>
                <div class="flex min-w-0 flex-col items-center">
                  <span class="text-4xl font-bold tabular-nums">
                    {{ selected.opponentRaceTo }}
                  </span>
                  <span
                    class="text-base-content/60 max-w-full truncate text-xs"
                  >
                    {{ opponent.name ?? $t('player.guestName') }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2">
            <button
              class="btn btn-ghost btn-sm"
              type="button"
              :aria-expanded="showOthers"
              @click="showOthers = !showOthers"
            >
              {{
                $t('games.fairSingleRace.briefing.otherRaces', {
                  count: (races?.length ?? 1) - 1,
                })
              }}
            </button>

            <div
              v-if="showOthers && races"
              role="radiogroup"
              class="flex flex-col gap-2"
            >
              <button
                v-for="option in races"
                :key="`${option.playerRaceTo}-${option.opponentRaceTo}`"
                type="button"
                role="radio"
                :aria-checked="option === selected"
                class="btn btn-block justify-between"
                :class="option === selected ? 'btn-primary' : 'btn-outline'"
                @click="choose(option)"
              >
                <span class="font-mono tabular-nums">
                  {{ option.playerRaceTo }} - {{ option.opponentRaceTo }}
                </span>
                <Icon
                  v-if="option.recommended"
                  name="mdi:fire"
                  class="text-warning size-4"
                />
              </button>
            </div>
          </div>

          <button class="btn btn-primary" type="button" @click="play">
            {{ $t('games.fairSingleRace.briefing.play') }}
          </button>
        </template>
      </div>
    </main>
  </div>
</template>
