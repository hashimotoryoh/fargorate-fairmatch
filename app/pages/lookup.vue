<script setup lang="ts">
const { t } = useI18n()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.lookup.title'),
  description: () => t('seo.lookup.description'),
  ogDescription: () => t('seo.lookup.description'),
})

const { query, players, pending, errorMessage, search } = usePlayerSearch()
</script>

<template>
  <div class="mx-auto flex w-full max-w-2xl flex-col gap-6">
    <div>
      <h1 class="text-xl font-bold">{{ $t('lookup.heading') }}</h1>
      <p class="text-base-content/70 mt-1 text-sm">{{ $t('lookup.lead') }}</p>
    </div>

    <form class="flex flex-col gap-4" @submit.prevent="search">
      <label class="floating-label">
        <span>{{ $t('lookup.queryLabel') }}</span>
        <input
          v-model.trim="query"
          class="input input-bordered w-full"
          type="text"
          :maxlength="PLAYER_QUERY_MAX_LENGTH"
          placeholder="John Doe"
          required
        />
      </label>

      <button class="btn btn-primary" type="submit" :disabled="pending">
        <span v-if="pending" class="loading loading-spinner" />
        {{ $t('lookup.submit') }}
      </button>
    </form>

    <div v-if="errorMessage" role="alert" class="alert alert-error">
      {{ errorMessage }}
    </div>

    <section v-else-if="players" class="flex flex-col gap-3">
      <h2 class="text-lg font-bold">{{ $t('lookup.resultsHeading') }}</h2>

      <p v-if="!players.length" class="text-base-content/70 text-sm">
        {{ $t('lookup.empty') }}
      </p>

      <ul v-else class="flex flex-col gap-3">
        <!--
          `readableId` はこのAPIの表示用IDで、リンクに使うFargoRate ID
          （`membershipId`）とは別物。無い場合に備えて添字で補う。
        -->
        <li
          v-for="(player, index) in players"
          :key="player.readableId ?? index"
          class="card bg-base-200"
        >
          <PlayerRow :player="player" />
        </li>
      </ul>
    </section>
  </div>
</template>
