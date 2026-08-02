<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()
const localePath = useLocalePath()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.settings.title') })

const { user, clear } = useUserSession()
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true

  try {
    await clear()
    await navigateTo(localePath('/'))
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <h1 class="text-xl font-bold">{{ $t('settings.heading') }}</h1>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">{{ $t('settings.account') }}</h2>
          <!--
            名前とIDの並び順は言語で変わるため、文の組み立てごと翻訳に任せる。
            ゲストは見せるIDが無いので、文そのものを別のキーに分ける。
          -->
          <p v-if="user" class="text-base-content/70 mt-1 text-sm">
            {{
              isFargoRatePlayer(user)
                ? $t('settings.signedInAs', {
                    name: user.name,
                    fargorateId: user.fargorateId,
                  })
                : $t('settings.signedInAsGuest', {
                    name: user.name ?? $t('player.guestName'),
                  })
            }}
          </p>
        </div>

        <div class="card-actions">
          <button
            class="btn btn-outline btn-error"
            type="button"
            :disabled="signingOut"
            @click="signOut"
          >
            <span v-if="signingOut" class="loading loading-spinner" />
            {{ $t('settings.signOut') }}
          </button>
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">{{ $t('settings.theme') }}</h2>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('settings.themeDescription') }}
          </p>
        </div>

        <div class="card-actions">
          <ThemeSwitcher />
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">{{ $t('settings.language') }}</h2>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('settings.languageDescription') }}
          </p>
        </div>

        <div class="card-actions">
          <LocaleSwitcher />
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">{{ $t('document.blog') }}</h2>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('settings.blogDescription') }}
          </p>
        </div>

        <div class="card-actions">
          <NuxtLink :to="localePath('/blog')" class="btn btn-outline">
            {{ $t('document.blog') }}
          </NuxtLink>
        </div>
      </div>
    </div>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">{{ $t('document.faq') }}</h2>
          <p class="text-base-content/70 mt-1 text-sm">
            {{ $t('settings.faqDescription') }}
          </p>
        </div>

        <div class="card-actions">
          <NuxtLink :to="localePath('/faq')" class="btn btn-outline">
            {{ $t('document.faq') }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
