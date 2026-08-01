<script setup lang="ts">
import type { PlayerProfile } from '#shared/types/player'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.lookup.title'),
  description: () => t('seo.lookup.description'),
  ogTitle: () => t('seo.lookup.ogTitle'),
  ogDescription: () => t('seo.lookup.ogDescription'),
})

const route = useRoute()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()
const { recentAccounts, addRecentAccount, removeRecentAccount } =
  useRecentAccounts()

const fargorateId = ref('')
// 'input' はID入力、'confirm' は本人確認のステップ。
const step = ref<'input' | 'confirm'>('input')
const candidate = ref<PlayerProfile | null>(null)
const pending = ref(false)
const errorMessage = ref('')

// サーバールートは英語のstatusMessageしか返さないため、表示する文言は
// ステータスコードからこちらで組み立てる。
function toErrorMessage(error: unknown) {
  const statusCode = (error as { statusCode?: number }).statusCode

  if (statusCode === 404) {
    return t('lookup.errors.notFound')
  }
  if (statusCode === 400) {
    return t('lookup.errors.invalidId')
  }
  return t('lookup.errors.unexpected')
}

async function lookup() {
  if (!isValidFargorateId(fargorateId.value)) {
    errorMessage.value = t('lookup.errors.invalidId')
    return
  }

  pending.value = true
  errorMessage.value = ''

  try {
    candidate.value = await $fetch<PlayerProfile>('/api/lookup', {
      method: 'POST',
      body: { fargorateId: fargorateId.value },
    })
    step.value = 'confirm'
  } catch (error) {
    errorMessage.value = toErrorMessage(error)
  } finally {
    pending.value = false
  }
}

// 認証を確定し、アカウントを記憶したうえで元々開こうとしていたページへ移動する。
async function completeSignIn(id: string, account: RecentAccount) {
  pending.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/session', {
      method: 'POST',
      body: { fargorateId: id },
    })
    addRecentAccount(account)
    await refreshSession()
    // `resolveRedirectPath` はロケールを知らない純粋な関数に保つ。オープン
    // リダイレクトの判定と、ロケールの付与を混ぜないため、ここで通す。
    // 既にロケールを含むパスを渡しても二重には付かない。
    await navigateTo(localePath(resolveRedirectPath(route.query.redirect)))
  } catch (error) {
    errorMessage.value = toErrorMessage(error)
  } finally {
    pending.value = false
  }
}

// 本人だと確認できたので認証を確定する。
async function confirm() {
  if (!candidate.value) return
  await completeSignIn(candidate.value.fargorateId, candidate.value)
}

// 過去に本人確認したアカウントは、選んだ時点で本人だとわかっているため、
// 確認画面を経由せず直接サインインする。
async function selectRecentAccount(account: RecentAccount) {
  await completeSignIn(account.fargorateId, account)
}

// 本人ではなかったので、ID入力からやり直す。
function reject() {
  candidate.value = null
  step.value = 'input'
  errorMessage.value = ''
}
</script>

<template>
  <!-- ヘッダーとフッターを除いた領域の中央にフォームを置く。 -->
  <div class="grid min-h-[calc(100dvh-14rem)] place-items-center">
    <div class="card bg-base-200 w-full max-w-md">
      <div class="card-body gap-4">
        <div>
          <h1 class="text-xl font-bold">{{ $t('lookup.heading') }}</h1>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('lookup.lead') }}
          </p>
        </div>

        <div v-if="errorMessage" role="alert" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form
          v-if="step === 'input'"
          class="flex flex-col gap-4"
          @submit.prevent="lookup"
        >
          <label class="floating-label">
            <span>{{ $t('lookup.idLabel') }}</span>
            <input
              v-model.trim="fargorateId"
              class="input input-bordered w-full"
              type="text"
              inputmode="numeric"
              maxlength="13"
              placeholder="9900006315553"
              required
            />
          </label>

          <div
            v-if="recentAccounts.length"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="text-base-content/70 text-xs">
              {{ $t('lookup.recentAccounts.label') }}
            </span>
            <div
              v-for="account in recentAccounts"
              :key="account.fargorateId"
              class="join"
            >
              <button
                type="button"
                class="btn btn-outline btn-xs join-item"
                :disabled="pending"
                @click="selectRecentAccount(account)"
              >
                {{ account.firstName }} {{ account.lastName }} ({{
                  account.effectiveRating
                }})
              </button>
              <button
                type="button"
                class="btn btn-outline btn-xs join-item"
                :aria-label="$t('lookup.recentAccounts.remove')"
                :disabled="pending"
                @click="removeRecentAccount(account.fargorateId)"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="text-center">
            <LookupGuideModal />
          </div>

          <button class="btn btn-primary" type="submit" :disabled="pending">
            <span v-if="pending" class="loading loading-spinner" />
            {{ $t('lookup.submit') }}
          </button>
        </form>

        <div v-else-if="candidate" class="flex flex-col gap-4">
          <p class="text-sm">{{ $t('lookup.confirmQuestion') }}</p>

          <PlayerProfileTable :player="candidate" />

          <div class="flex gap-2">
            <button
              class="btn btn-primary flex-1"
              type="button"
              :disabled="pending"
              @click="confirm"
            >
              <span v-if="pending" class="loading loading-spinner" />
              {{ $t('lookup.confirm') }}
            </button>
            <button
              class="btn flex-1"
              type="button"
              :disabled="pending"
              @click="reject"
            >
              {{ $t('lookup.reject') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
