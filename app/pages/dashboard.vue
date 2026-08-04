<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

const { t } = useI18n()
const localePath = useLocalePath()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({ title: () => t('seo.dashboard.title') })

const { user } = useUserSession()
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('dashboard.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">
        {{ $t('dashboard.lead') }}
      </p>
    </div>

    <PlayerProfileTable v-if="user" :player="user" show-membership-id />

    <NuxtLink :to="localePath('/game')" class="btn btn-primary">
      {{ $t('dashboard.startGame') }}
    </NuxtLink>
  </div>
</template>
