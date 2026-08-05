<script setup lang="ts">
import type { FargoRatePlayer } from '#shared/types/player'

const { opponent } = defineProps<{ opponent: FargoRatePlayer }>()

const emit = defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="card bg-base-200 border-base-300 hover:border-primary w-full border text-left transition-colors cursor-pointer"
    @click="emit('select')"
  >
    <PlayerRow :player="opponent" />
  </button>
</template>
