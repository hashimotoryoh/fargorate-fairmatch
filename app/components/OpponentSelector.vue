<script setup lang="ts">
import type {
  FargoRatePlayer,
  FargoRateSearchResult,
} from '#shared/types/player'
import type { GameOpponent } from '~/composables/useGameSetup'

// 選んだ対戦相手をどう保存しどこへ進むかは、ブリーフィング側が決める。
const emit = defineEmits<{ select: [opponent: GameOpponent] }>()

const { t } = useI18n()
const { user } = useUserSession()
const { recentOpponents } = useRecentOpponents()
const { query, players, pending, errorMessage, search } = usePlayerSearch()

const method = ref<'search' | 'guest'>('search')
const guestError = ref('')

// 「自分のIDを入れる場面だ」と誤解されないよう、誰の相手を選んでいるのかを
// リード文で明示する。
const selfName = computed(() => user.value?.name ?? t('player.guestName'))

/**
 * メンバーシップIDの無い候補は対戦相手にしない。最近の対戦相手への保存と、
 * ゲーム設定でのレーティングの引き直しの鍵が無いため。
 */
function selectResult(result: FargoRateSearchResult) {
  if (!result.membershipId) return

  emit('select', {
    kind: 'fargorate',
    name: result.name,
    membershipId: result.membershipId,
    readableId: result.readableId,
    location: result.location,
    rating: result.rating,
    robustness: result.robustness,
  })
}

// 最近の対戦相手は過去に選択済みなので、検索を経ずにそのまま確定する。
function selectRecent(opponent: FargoRatePlayer) {
  emit('select', opponent)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h2 class="text-lg font-bold">
        {{ $t('games.briefing.opponent.heading') }}
      </h2>
      <p class="text-base-content/70 mt-1 text-sm">
        {{ $t('games.briefing.opponent.lead', { name: selfName }) }}
      </p>
    </div>

    <div role="tablist" class="tabs tabs-box">
      <button
        role="tab"
        type="button"
        class="tab flex-1"
        :class="{ 'tab-active': method === 'search' }"
        @click="method = 'search'"
      >
        {{ $t('games.briefing.opponent.methodSearch') }}
      </button>
      <button
        role="tab"
        type="button"
        class="tab flex-1"
        :class="{ 'tab-active': method === 'guest' }"
        @click="method = 'guest'"
      >
        {{ $t('games.briefing.opponent.methodGuest') }}
      </button>
    </div>

    <template v-if="method === 'search'">
      <form class="flex flex-col gap-4" @submit.prevent="search">
        <label class="floating-label">
          <span>{{ $t('lookup.queryLabel') }}</span>
          <input
            v-model.trim="query"
            class="input input-bordered w-full"
            type="text"
            :maxlength="PLAYER_QUERY_MAX_LENGTH"
            placeholder="John Doe"
            required
          />
        </label>

        <button class="btn btn-primary" type="submit" :disabled="pending">
          <span v-if="pending" class="loading loading-spinner" />
          {{ $t('games.briefing.opponent.search') }}
        </button>
      </form>

      <div v-if="errorMessage" role="alert" class="alert alert-error">
        {{ errorMessage }}
      </div>

      <section v-else-if="players" class="flex flex-col gap-3">
        <p v-if="!players.length" class="text-base-content/70 text-sm">
          {{ $t('lookup.empty') }}
        </p>

        <ul v-else class="flex flex-col gap-3">
          <li
            v-for="(player, index) in players"
            :key="player.readableId ?? index"
          >
            <button
              type="button"
              class="card bg-base-200 border-base-300 w-full border text-left transition-colors disabled:opacity-60"
              :class="player.membershipId ? 'hover:border-primary' : ''"
              :disabled="!player.membershipId"
              @click="selectResult(player)"
            >
              <PlayerSearchResultCard :player="player" />
              <p
                v-if="!player.membershipId"
                class="text-base-content/60 px-4 pb-3 text-xs"
              >
                {{ $t('games.briefing.opponent.noId') }}
              </p>
            </button>
          </li>
        </ul>
      </section>

      <div v-if="recentOpponents.length" class="flex flex-col gap-2">
        <h3 class="text-base-content/70 text-xs font-bold">
          {{ $t('games.recentOpponents.label') }}
        </h3>
        <ul class="flex flex-col gap-2">
          <li v-for="opponent in recentOpponents" :key="opponent.membershipId">
            <button
              type="button"
              class="btn btn-outline btn-block justify-between"
              @click="selectRecent(opponent)"
            >
              <span class="truncate">{{ opponent.name }}</span>
              <span class="font-mono text-xs font-normal">
                {{ opponent.rating }} / {{ opponent.robustness }}
              </span>
            </button>
          </li>
        </ul>
      </div>
    </template>

    <template v-else>
      <div v-if="guestError" role="alert" class="alert alert-error">
        {{ guestError }}
      </div>

      <GuestPlayerForm
        :submit-label="$t('games.briefing.opponent.guestSubmit')"
        @submit="emit('select', $event)"
        @invalid="guestError = $event"
      />
    </template>
  </div>
</template>
