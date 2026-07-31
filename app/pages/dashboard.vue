<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

useSeoMeta({ title: 'ダッシュボード' })

const { user } = useUserSession()
</script>

<template>
  <div class="mx-auto flex max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">ダッシュボード</h1>
      <p class="text-base-content/70 mt-1 text-sm">
        FargoRateから取得したあなたの情報です。
      </p>
    </div>

    <PlayerProfileTable v-if="user" :player="user" show-fargorate-id />

    <NuxtLink to="/game" class="btn btn-primary">ゲームを始める</NuxtLink>
  </div>
</template>
