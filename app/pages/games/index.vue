<script setup lang="ts">
import type { FargoRatePlayer } from '#shared/types/player'
import type { GameSlug } from '~/utils/games'

definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.games.title') })

const localePath = useLocalePath()
const { setOpponent } = useGameSetup()
const { recentOpponents, removeRecentOpponent } = useRecentOpponents()

// ゲームは公開情報のスラッグなので、クエリでブリーフィングへ渡す。
async function startWithGame(slug: GameSlug) {
  await navigateTo(localePath({ path: '/games/briefing', query: { game: slug } }))
}

// 対戦相手はURLに載せず、状態に書き込んでからブリーフィングへ移る。
// 他人のFargoRate IDをURLや履歴に残さないため。
async function startWithOpponent(opponent: FargoRatePlayer) {
  setOpponent(opponent)
  await navigateTo(localePath('/games/briefing'))
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('games.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('games.lead') }}</p>
    </div>

    <GameSelector @select="startWithGame" />

    <section v-if="recentOpponents.length" class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">{{ $t('games.recentOpponents.label') }}</h2>

      <ul class="flex flex-col gap-2">
        <li
          v-for="opponent in recentOpponents"
          :key="opponent.membershipId"
          class="join w-full"
        >
          <button
            type="button"
            class="btn btn-outline join-item flex-1 justify-between"
            @click="startWithOpponent(opponent)"
          >
            <span class="truncate">{{ opponent.name }}</span>
            <span class="font-mono text-xs font-normal">
              {{ opponent.rating }} / {{ opponent.robustness }}
            </span>
          </button>
          <button
            type="button"
            class="btn btn-outline join-item"
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
