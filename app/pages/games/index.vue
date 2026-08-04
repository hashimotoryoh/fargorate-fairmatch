<script setup lang="ts">
import type { FargoRatePlayer } from '#shared/types/player'
import type { GameSlug } from '~/utils/games'

definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.title') })

const route = useRoute()
const localePath = useLocalePath()
const { startWithGame, startWithOpponent } = useGameSetup()
const { recentOpponents, removeRecentOpponent } = useRecentOpponents()

// 入口では選択を丸ごと作り直す。前回の残りが付いてくると、選んでいない
// ステップが完了済みで始まってしまう。戻り先も併せて覚える。
async function selectGame(slug: GameSlug) {
  startWithGame(slug, route.fullPath)
  await navigateTo(localePath('/games/briefing'))
}

// 対戦相手はURLに載せず、状態に書き込んでからブリーフィングへ移る。
// 他人のFargoRate IDをURLや履歴に残さないため。
async function selectOpponent(opponent: FargoRatePlayer) {
  startWithOpponent(opponent, route.fullPath)
  await navigateTo(localePath('/games/briefing'))
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('games.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('games.lead') }}</p>
    </div>

    <GameSelector @select="selectGame" />

    <section v-if="recentOpponents.length" class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">{{ $t('games.recentOpponents.label') }}</h2>

      <ul class="flex flex-col gap-2">
        <li
          v-for="opponent in recentOpponents"
          :key="opponent.membershipId"
          class="flex items-center gap-2"
        >
          <div class="min-w-0 flex-1">
            <RecentOpponentCard
              :opponent="opponent"
              @select="selectOpponent(opponent)"
            />
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-circle"
            :aria-label="
              $t('games.recentOpponents.remove', { name: opponent.name })
            "
            @click="removeRecentOpponent(opponent.membershipId)"
          >
            ✕
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
