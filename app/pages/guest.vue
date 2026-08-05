<script setup lang="ts">
import type { GuestPlayer } from '#shared/types/player'

definePageMeta({ middleware: 'guest' })

const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.guest.title'),
  description: () => t('seo.guest.description'),
  ogDescription: () => t('seo.guest.description'),
})

const route = useRoute()
const localePath = useLocalePath()
const { fetch: refreshSession } = useUserSession()
const { execute: executeRecaptcha } = useRecaptcha()

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

async function startAsGuest(player: GuestPlayer) {
  pending.value = true
  errorMessage.value = ''

  try {
    const recaptchaToken = await executeRecaptcha('guest')
    await $fetch<GuestPlayer>('/api/auth/guest', {
      method: 'POST',
      body: { name: player.name, rating: player.rating, recaptchaToken },
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

        <GuestPlayerForm
          :submit-label="$t('guest.submit')"
          :pending="pending"
          @submit="startAsGuest"
          @invalid="errorMessage = $event"
        />

        <div class="text-center">
          <NuxtLink :to="linkPath" class="btn btn-link btn-sm">
            {{ $t('guest.fargorateLink') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
