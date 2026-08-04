<script setup lang="ts">
import type { FargoRatePlayer } from '#shared/types/player'
import type { RecentAccount } from '~/composables/useRecentAccounts'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.link.title'),
  description: () => t('seo.link.description'),
  ogDescription: () => t('seo.link.description'),
})

const route = useRoute()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()
const { recentAccounts, addRecentAccount, removeRecentAccount } =
  useRecentAccounts()
const { execute: executeRecaptcha } = useRecaptcha()

// FargoRateのAPIはメンバーシップID（UIでいうFargoRate ID）での検索を受け付け
// ないため、名前で検索した候補をIDの一致で絞る。それに必要な2項目を入力させる。
const playerName = ref('')
const membershipId = ref('')
// 'input' は名前とIDの入力、'confirm' は本人確認のステップ。
const step = ref<'input' | 'confirm'>('input')

// サジェストの表示にも、削除ボタンのaria-label（対象の識別）にも使う。
function accountLabel(account: RecentAccount) {
  return `${account.name} (${account.rating})`
}
const candidate = ref<FargoRatePlayer | null>(null)

// ゲストの導線でも元々開こうとしていたページを引き継ぐ。
const guestPath = computed(() =>
  localePath({
    path: '/guest',
    query:
      typeof route.query.redirect === 'string'
        ? { redirect: route.query.redirect }
        : {},
  }),
)
const pending = ref(false)
const errorMessage = ref('')

const invalidNameMessage = computed(() =>
  t('link.errors.invalidName', {
    min: PLAYER_QUERY_MIN_LENGTH,
    max: PLAYER_QUERY_MAX_LENGTH,
  }),
)

// サーバールートは英語のstatusMessageしか返さないため、表示する文言は
// ステータスコードからこちらで組み立てる。
function toErrorMessage(error: unknown) {
  const statusCode = (error as { statusCode?: number }).statusCode

  if (statusCode === 404) {
    return t('link.errors.notFound')
  }
  // 400はどちらの項目が弾かれたか判別できないため、両方の確認を促す。
  if (statusCode === 400) {
    return t('link.errors.invalidInput')
  }
  if (statusCode === 422) {
    return t('link.errors.recaptchaFailed')
  }
  return t('link.errors.unexpected')
}

async function searchPlayer() {
  if (!isValidPlayerQuery(playerName.value)) {
    errorMessage.value = invalidNameMessage.value
    return
  }
  if (!isValidMembershipId(membershipId.value)) {
    errorMessage.value = t('link.errors.invalidId')
    return
  }

  pending.value = true
  errorMessage.value = ''

  try {
    const recaptchaToken = await executeRecaptcha('link')
    candidate.value = await $fetch<FargoRatePlayer>('/api/link/lookup', {
      method: 'POST',
      body: {
        name: playerName.value,
        membershipId: membershipId.value,
        recaptchaToken,
      },
    })
    step.value = 'confirm'
  } catch (error) {
    errorMessage.value = toErrorMessage(error)
  } finally {
    pending.value = false
  }
}

// リンクを確定し、アカウントを記憶したうえで元々開こうとしていたページへ移動する。
// サーバーが再ルックアップした最新のプレイヤー情報を記憶に使う。呼び出し元が
// 持つ情報（サジェストのlocalStorageの値など）は古い可能性があるため使わない。
async function completeLink(name: string, id: string) {
  pending.value = true
  errorMessage.value = ''

  try {
    const profile = await $fetch<FargoRatePlayer>('/api/auth/session', {
      method: 'POST',
      body: { name, membershipId: id },
    })
    addRecentAccount(profile)
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

// 本人だと確認できたのでリンクを確定する。入力欄の値ではなく、ルックアップで
// 得たプレイヤーの名前とIDを使う。状態が食い違った場合に、ユーザーが確認して
// いない別のプレイヤーでリンクしないため。
async function confirm() {
  if (!candidate.value) return
  await completeLink(candidate.value.name, candidate.value.membershipId)
}

// 過去に本人確認したアカウントは、選んだ時点で本人だとわかっているため、
// 確認画面を経由せず直接リンクを確定する。記憶している名前はサーバーが
// ルックアップした結果なので、そのまま検索の鍵に使える。
async function selectRecentAccount(account: RecentAccount) {
  await completeLink(account.name, account.membershipId)
}

// 本人ではなかったので、入力からやり直す。
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
          <h1 class="text-xl font-bold">{{ $t('link.heading') }}</h1>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('link.lead') }}
          </p>
        </div>

        <div v-if="errorMessage" role="alert" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form
          v-if="step === 'input'"
          class="flex flex-col gap-4"
          @submit.prevent="searchPlayer"
        >
          <label class="floating-label">
            <span>{{ $t('link.nameLabel') }}</span>
            <input
              v-model.trim="playerName"
              class="input input-bordered w-full"
              type="text"
              :maxlength="PLAYER_QUERY_MAX_LENGTH"
              placeholder="Ryoh Hashimoto"
              required
            />
          </label>

          <label class="floating-label">
            <span>{{ $t('link.idLabel') }}</span>
            <input
              v-model.trim="membershipId"
              class="input input-bordered w-full"
              type="text"
              inputmode="numeric"
              placeholder="9900006315553"
              required
            />
          </label>

          <div
            v-if="recentAccounts.length"
            class="flex flex-wrap items-center gap-2"
          >
            <span class="text-base-content/70 text-xs">
              {{ $t('link.recentAccounts.label') }}
            </span>
            <div
              v-for="account in recentAccounts"
              :key="account.membershipId"
              class="join"
            >
              <button
                type="button"
                class="btn btn-outline btn-xs join-item"
                :disabled="pending"
                @click="selectRecentAccount(account)"
              >
                {{ accountLabel(account) }}
              </button>
              <button
                type="button"
                class="btn btn-outline btn-xs join-item"
                :aria-label="
                  $t('link.recentAccounts.remove', {
                    name: accountLabel(account),
                  })
                "
                :disabled="pending"
                @click="removeRecentAccount(account.membershipId)"
              >
                ✕
              </button>
            </div>
          </div>

          <div class="text-center">
            <FargoRateIdGuideModal />
          </div>

          <button class="btn btn-primary" type="submit" :disabled="pending">
            <span v-if="pending" class="loading loading-spinner" />
            {{ $t('link.submit') }}
          </button>

          <div class="text-center">
            <NuxtLink :to="guestPath" class="btn btn-link btn-sm">
              {{ $t('link.guestLink') }}
            </NuxtLink>
          </div>
        </form>

        <div v-else-if="candidate" class="flex flex-col gap-4">
          <p class="text-sm">{{ $t('link.confirmQuestion') }}</p>

          <PlayerCard :player="candidate" />

          <div class="flex gap-2">
            <button
              class="btn btn-primary flex-1"
              type="button"
              :disabled="pending"
              @click="confirm"
            >
              <span v-if="pending" class="loading loading-spinner" />
              {{ $t('link.confirm') }}
            </button>
            <button
              class="btn flex-1"
              type="button"
              :disabled="pending"
              @click="reject"
            >
              {{ $t('link.reject') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
