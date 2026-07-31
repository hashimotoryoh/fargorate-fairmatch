<script setup lang="ts">
definePageMeta({ middleware: 'auth', layout: 'authenticated' })

useSeoMeta({ title: 'ダッシュボード' })
</script>

<template>
  <h1 class="text-xl font-bold">ダッシュボード</h1>
</template>
