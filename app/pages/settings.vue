<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

useSeoMeta({ title: '設定' })

const { user, clear } = useUserSession()
const signingOut = ref(false)

async function signOut() {
  signingOut.value = true

  try {
    await clear()
    await navigateTo('/')
  } finally {
    signingOut.value = false
  }
}
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <h1 class="text-xl font-bold">設定</h1>

    <div class="card bg-base-200">
      <div class="card-body gap-4">
        <div>
          <h2 class="card-title text-base">アカウント</h2>
          <p v-if="user" class="text-base-content/70 mt-1 text-sm">
            {{ user.firstName }} {{ user.lastName }}（{{ user.fargorateId }}）
            としてサインインしています。
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
            サインアウト
          </button>
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
  </div>
</template>
