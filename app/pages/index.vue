<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

// ロケールを切り替えたときに追随させるため、値ではなくゲッターで渡す。
useSeoMeta({
  title: () => t('seo.index.title'),
  description: () => t('seo.index.description'),
  ogTitle: () => t('seo.index.ogTitle'),
  ogDescription: () => t('seo.index.ogDescription'),
})

// 文言は翻訳ファイルにあるため、ここではキーの並びだけを持つ。
const featureKeys = ['record', 'review', 'rating'] as const
const ratingGuideKeys = [
  'beginner',
  'intermediate',
  'advanced',
  'professional',
] as const
</script>

<template>
  <div class="flex flex-col gap-16 py-8">
    <section class="hero">
      <div class="hero-content flex-col gap-6 text-center">
        <AppLogo class="text-primary size-20" />

        <div class="flex flex-col gap-4">
          <h1 class="text-3xl font-bold sm:text-4xl">FargoRate FairMatch</h1>
          <p class="text-base-content/80 mx-auto max-w-xl">
            {{ $t('index.lead') }}
          </p>
        </div>

        <div class="flex flex-col items-center gap-2">
          <NuxtLink :to="localePath('/lookup')" class="btn btn-primary btn-lg">
            {{ $t('index.start') }}
          </NuxtLink>
          <NuxtLink :to="localePath('/guest')" class="btn btn-link btn-sm">
            {{ $t('index.startAsGuest') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-6">
      <h2 class="text-center text-2xl font-bold">
        {{ $t('index.featuresHeading') }}
      </h2>

      <div class="grid gap-4 md:grid-cols-3">
        <div v-for="key in featureKeys" :key="key" class="card bg-base-200">
          <div class="card-body gap-2">
            <h3 class="card-title text-base">
              {{ $t(`index.features.${key}.title`) }}
            </h3>
            <p class="text-base-content/70 text-sm">
              {{ $t(`index.features.${key}.description`) }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="flex flex-col gap-6">
      <div class="flex flex-col gap-2 text-center">
        <h2 class="text-2xl font-bold">{{ $t('index.aboutHeading') }}</h2>
        <p class="text-base-content/80 mx-auto max-w-2xl text-sm">
          {{ $t('index.aboutBody') }}
        </p>
      </div>

      <div class="mx-auto w-full max-w-xl overflow-x-auto">
        <table class="table">
          <thead>
            <tr>
              <th>{{ $t('index.ratingTable.level') }}</th>
              <th>{{ $t('index.ratingTable.range') }}</th>
              <th class="hidden sm:table-cell">
                {{ $t('index.ratingTable.note') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="key in ratingGuideKeys" :key="key">
              <th>{{ $t(`index.ratingGuide.${key}.level`) }}</th>
              <td>{{ $t(`index.ratingGuide.${key}.range`) }}</td>
              <td class="text-base-content/70 hidden text-sm sm:table-cell">
                {{ $t(`index.ratingGuide.${key}.note`) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="flex flex-col items-center gap-4 text-center">
      <h2 class="text-2xl font-bold">
        {{ $t('index.gettingStartedHeading') }}
      </h2>
      <p class="text-base-content/80 max-w-xl text-sm">
        {{ $t('index.gettingStartedBody') }}
      </p>
      <p class="text-base-content/60 max-w-xl text-xs">
        {{ $t('index.gettingStartedNote') }}
      </p>
      <NuxtLink :to="localePath('/lookup')" class="btn btn-primary">
        {{ $t('index.start') }}
      </NuxtLink>
      <NuxtLink :to="localePath('/guest')" class="btn btn-link btn-sm">
        {{ $t('index.startAsGuest') }}
      </NuxtLink>
    </section>
  </div>
</template>
