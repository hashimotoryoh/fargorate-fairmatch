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
    // 前回の結果を残したままエラーを出すと、どちらの検索の結果か読めなくなる。
    players.value = null
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

    <section v-else-if="players" class="flex flex-col gap-2">
      <h2 class="text-lg font-bold">{{ $t('lookup.resultsHeading') }}</h2>

      <p v-if="!players.length" class="text-base-content/70 text-sm">
        {{ $t('lookup.empty') }}
      </p>

      <!-- 狭い画面でも表が崩れないよう、はみ出す分は表の中で横スクロールさせる。 -->
      <div v-else class="overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('player.name') }}</th>
              <th class="text-right">{{ $t('player.rating') }}</th>
              <th class="text-right">{{ $t('player.robustness') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(player, index) in players"
              :key="player.fargorateId ?? index"
            >
              <td>{{ player.name }}</td>
              <td class="text-primary text-right font-bold">
                {{ player.rating }}
              </td>
              <td class="text-right">{{ player.robustness }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
