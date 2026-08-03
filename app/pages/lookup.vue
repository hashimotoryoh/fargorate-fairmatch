<script setup lang="ts">
import type { FargoRateSearchResult } from '#shared/types/player'

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.lookup.title'),
  description: () => t('seo.lookup.description'),
  ogTitle: () => t('seo.lookup.ogTitle'),
  ogDescription: () => t('seo.lookup.ogDescription'),
})

const { execute: executeRecaptcha } = useRecaptcha()

const query = ref('')
// 検索前と0件を区別するため、初期値は空配列ではなく null にする。
const players = ref<FargoRateSearchResult[] | null>(null)
const pending = ref(false)
const errorMessage = ref('')

const invalidQueryMessage = computed(() =>
  t('lookup.errors.invalidQuery', {
    min: PLAYER_QUERY_MIN_LENGTH,
    max: PLAYER_QUERY_MAX_LENGTH,
  }),
)

// サーバールートは英語のstatusMessageしか返さないため、表示する文言は
// ステータスコードからこちらで組み立てる。
function toErrorMessage(error: unknown) {
  const statusCode = (error as { statusCode?: number }).statusCode

  if (statusCode === 400) {
    return invalidQueryMessage.value
  }
  if (statusCode === 422) {
    return t('lookup.errors.recaptchaFailed')
  }
  return t('lookup.errors.unexpected')
}

async function search() {
  // 前回の結果を残したままエラーを出すと、どちらの検索の結果か読めなくなる。
  // 入力を弾くときも、通信に失敗したときも同じように消す。
  players.value = null

  if (!isValidPlayerQuery(query.value)) {
    errorMessage.value = invalidQueryMessage.value
    return
  }

  pending.value = true
  errorMessage.value = ''

  try {
    const recaptchaToken = await executeRecaptcha('playerLookup')
    players.value = await $fetch<FargoRateSearchResult[]>(
      '/api/players/lookup',
      {
        method: 'POST',
        body: { query: query.value, recaptchaToken },
      },
    )
  } catch (error) {
    errorMessage.value = toErrorMessage(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('lookup.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('lookup.lead') }}</p>
    </div>

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
        {{ $t('lookup.submit') }}
      </button>
    </form>

    <div v-if="errorMessage" role="alert" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <section v-else-if="players" class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">{{ $t('lookup.resultsHeading') }}</h2>

      <p v-if="!players.length" class="text-base-content/70 text-sm">
        {{ $t('lookup.empty') }}
      </p>

      <ul v-else class="flex flex-col gap-3">
        <!--
          `readableId` はこのAPIの表示用IDで、リンクに使う13桁のFargoRate ID
          （`fargorateId`）とは別物。欠けることもあるため、無ければ添字で補う。
        -->
        <li
          v-for="(player, index) in players"
          :key="player.readableId ?? index"
          class="card bg-base-200"
        >
          <div class="card-body gap-3 p-4">
            <div>
              <p class="font-bold">{{ player.name }}</p>
              <p
                v-if="player.location"
                class="text-base-content/60 mt-0.5 text-xs"
              >
                {{ player.location }}
              </p>
            </div>

            <!-- レーティングと信頼度はこのアプリの中心的な数値なので独立して見せる。 -->
            <div class="stats stats-horizontal bg-base-100 w-full">
              <div class="stat place-items-center">
                <div class="stat-title">{{ $t('player.rating') }}</div>
                <div class="stat-value text-primary">{{ player.rating }}</div>
              </div>
              <div class="stat place-items-center">
                <div class="stat-title">{{ $t('player.robustness') }}</div>
                <div class="stat-value">{{ player.robustness }}</div>
              </div>
            </div>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
