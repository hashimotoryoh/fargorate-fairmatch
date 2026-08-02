<script setup lang="ts">
// エラー発生時は app.vue を経由せず、このコンポーネントが直接ルートに描画される
// （app.vue が html の lang とテーマの data-theme を出しているが、ここには乗らない）。
// そのため、その2つだけはここでも自分で立てる。
const { error } = defineProps<{
  error: { statusCode?: number; statusMessage?: string; message?: string }
}>()

const { t, locale } = useI18n()
const localePath = useLocalePath()
const theme = useTheme()

const isNotFound = computed(() => error.statusCode === 404)

useHead({
  htmlAttrs: {
    lang: () => locale.value,
    'data-theme': () => theme.value,
  },
})

// 検索エンジンに載せる意味の無いページなので、保護ページと同様に noindex にする。
// 生の statusMessage・message は内部情報を含みうるため画面には出さない。
useSeoMeta({
  robots: 'noindex, nofollow',
  title: () =>
    t(isNotFound.value ? 'error.notFound.heading' : 'error.unexpected.heading'),
})

function handleBackHome() {
  clearError({ redirect: localePath('/') })
}
</script>

<template>
  <NuxtLayout name="default">
    <div class="hero min-h-[60vh]">
      <div class="hero-content flex-col gap-6 text-center">
        <Icon
          :name="
            isNotFound ? 'mdi:file-search-outline' : 'mdi:alert-circle-outline'
          "
          class="text-primary size-20"
        />

        <div class="flex flex-col gap-2">
          <p class="text-base-content/60 font-mono text-sm">
            {{ error.statusCode }}
          </p>
          <h1 class="text-2xl font-bold sm:text-3xl">
            {{
              $t(
                isNotFound
                  ? 'error.notFound.heading'
                  : 'error.unexpected.heading',
              )
            }}
          </h1>
          <p class="text-base-content/80 mx-auto max-w-md text-sm">
            {{
              $t(isNotFound ? 'error.notFound.lead' : 'error.unexpected.lead')
            }}
          </p>
        </div>

        <button type="button" class="btn btn-primary" @click="handleBackHome">
          {{ $t('error.backHome') }}
        </button>
      </div>
    </div>
  </NuxtLayout>
</template>
