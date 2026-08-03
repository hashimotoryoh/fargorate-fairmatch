<script setup lang="ts">
import type { GuestPlayer } from '#shared/types/player'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.guest.title'),
  description: () => t('seo.guest.description'),
  ogDescription: () => t('seo.guest.ogDescription'),
})

const route = useRoute()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()
const { execute: executeRecaptcha } = useRecaptcha()

const name = ref('')
// 空欄と 0 を区別する必要があるため、数値ではなく入力された文字列のまま持つ。
const rating = ref('')
const pending = ref(false)
const errorMessage = ref('')

// サーバールートは英語のstatusMessageしか返さないため、表示する文言は
// ステータスコードからこちらで組み立てる。
function toErrorMessage(error: unknown) {
  const statusCode = (error as { statusCode?: number }).statusCode

  if (statusCode === 400) {
    return t('guest.errors.invalidInput')
  }
  if (statusCode === 422) {
    return t('guest.errors.recaptchaFailed')
  }
  return t('guest.errors.unexpected')
}

async function startAsGuest() {
  const parsedRating = Number(rating.value)

  // `Number('')` は 0 になるため、空欄は別に見る。
  if (rating.value === '' || !isValidGuestRating(parsedRating)) {
    errorMessage.value = t('guest.errors.invalidRating', {
      min: GUEST_RATING_MIN,
      max: GUEST_RATING_MAX,
    })
    return
  }

  const trimmedName = name.value.trim()

  if (!isValidGuestName(trimmedName)) {
    errorMessage.value = t('guest.errors.invalidName', {
      max: GUEST_NAME_MAX_LENGTH,
    })
    return
  }

  pending.value = true
  errorMessage.value = ''

  try {
    const recaptchaToken = await executeRecaptcha('guest')
    await $fetch<GuestPlayer>('/api/auth/guest', {
      method: 'POST',
      // 未入力は null で送り、既定名は表示側の言語で補わせる。
      body: { name: trimmedName || null, rating: parsedRating, recaptchaToken },
    })
    await refreshSession()
    // `resolveRedirectPath` はロケールを知らない純粋な関数に保つ。オープン
    // リダイレクトの判定と、ロケールの付与を混ぜないため、ここで通す。
    await navigateTo(localePath(resolveRedirectPath(route.query.redirect)))
  } catch (error) {
    errorMessage.value = toErrorMessage(error)
  } finally {
    pending.value = false
  }
}

// FargoRateとのリンクへ戻る。元々の行き先は引き継ぐ。
const linkPath = computed(() =>
  localePath({
    path: '/link',
    query:
      typeof route.query.redirect === 'string'
        ? { redirect: route.query.redirect }
        : {},
  }),
)
</script>

<template>
  <!-- ヘッダーとフッターを除いた領域の中央にフォームを置く。 -->
  <div class="grid min-h-[calc(100dvh-14rem)] place-items-center">
    <div class="card bg-base-200 w-full max-w-md">
      <div class="card-body gap-4">
        <div>
          <h1 class="text-xl font-bold">{{ $t('guest.heading') }}</h1>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('guest.lead') }}
          </p>
        </div>

        <div v-if="errorMessage" role="alert" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="startAsGuest">
          <label class="floating-label">
            <span>{{ $t('guest.nameLabel') }}</span>
            <input
              v-model="name"
              class="input input-bordered w-full"
              type="text"
              :maxlength="GUEST_NAME_MAX_LENGTH"
              :placeholder="$t('player.guestName')"
            />
          </label>

          <label class="floating-label">
            <span>{{ $t('guest.ratingLabel') }}</span>
            <input
              v-model="rating"
              class="input input-bordered w-full"
              type="number"
              :min="GUEST_RATING_MIN"
              :max="GUEST_RATING_MAX"
              step="1"
              placeholder="450"
              required
            />
          </label>

          <p class="text-base-content/60 text-xs">
            {{
              $t('guest.ratingHint', {
                min: GUEST_RATING_MIN,
                max: GUEST_RATING_MAX,
              })
            }}
          </p>

          <button class="btn btn-primary" type="submit" :disabled="pending">
            <span v-if="pending" class="loading loading-spinner" />
            {{ $t('guest.submit') }}
          </button>
        </form>

        <div class="text-center">
          <NuxtLink :to="linkPath" class="btn btn-link btn-sm">
            {{ $t('guest.fargorateLink') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
