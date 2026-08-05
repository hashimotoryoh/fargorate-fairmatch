<script setup lang="ts">
const { repositoryUrl } = useRuntimeConfig().public

const localePath = useLocalePath()
const theme = useTheme()

// Nuxtのロゴは文字色を含むため、テーマの明暗に合わせて画像ごと差し替える。
const nuxtLogo = computed(() =>
  theme.value === 'dark'
    ? '/img/nuxt/logo-green-white.svg'
    : '/img/nuxt/logo-green-black.svg',
)
</script>

<template>
  <footer class="bg-base-200 border-base-300 border-t">
    <!--
      1段目: ブランドエリアとリンク集。daisyUIの footer で組み、
      スマホ幅では縦積み、sm以上では横並びにする。
    -->
    <div
      class="footer sm:footer-horizontal container mx-auto p-6 text-sm sm:p-10"
    >
      <aside class="max-w-xs">
        <p class="flex items-center gap-2 text-base font-bold">
          <Icon name="custom:app-logo" class="text-primary size-7 shrink-0" />
          <span>FargoRate FairRace</span>
        </p>
        <p class="text-base-content/70">{{ $t('index.lead') }}</p>
        <!-- 認証の要らない機能への導線。どのページからも辿れる必要がある。 -->
        <nav class="mt-2 flex flex-col items-start gap-1">
          <NuxtLink
            v-for="item in footerStartNavItems"
            :key="item.to"
            class="link link-hover"
            :to="localePath(item.to)"
          >
            {{ $t(item.labelKey) }}
          </NuxtLink>
        </nav>
        <p class="mt-2 flex items-center gap-1.5">
          <span>{{ $t('footer.builtWith') }}</span>
          <NuxtImg :src="nuxtLogo" alt="Nuxt" class="h-4 w-auto" />
        </p>
      </aside>

      <nav>
        <h6 class="footer-title">{{ $t('footer.support') }}</h6>
        <NuxtLink
          v-for="item in footerSupportNavItems"
          :key="item.to"
          class="link link-hover"
          :to="localePath(item.to)"
        >
          {{ $t(item.labelKey) }}
        </NuxtLink>
        <a
          class="link link-hover"
          :href="`${repositoryUrl}/issues/new`"
          target="_blank"
          rel="noopener"
        >
          {{ $t('footer.reportBug') }}
        </a>
        <!-- Nitroが生成する静的ルートでNuxtのページではないため、素のアンカーで開く。 -->
        <a
          class="link link-hover"
          href="/llms.txt"
          target="_blank"
          rel="noopener"
        >
          llms.txt
        </a>
      </nav>

      <nav>
        <h6 class="footer-title">{{ $t('footer.legal') }}</h6>
        <NuxtLink
          v-for="item in footerLegalNavItems"
          :key="item.to"
          class="link link-hover"
          :to="localePath(item.to)"
        >
          {{ $t(item.labelKey) }}
        </NuxtLink>
        <a
          class="link link-hover"
          :href="`${repositoryUrl}/blob/main/LICENSE`"
          target="_blank"
          rel="noopener"
        >
          {{ $t('footer.license') }}
        </a>
      </nav>

      <nav>
        <h6 class="footer-title">{{ $t('footer.frameworks') }}</h6>
        <a
          class="link link-hover"
          href="https://nuxt.com/"
          target="_blank"
          rel="noopener"
        >
          Nuxt
        </a>
        <a
          class="link link-hover"
          href="https://daisyui.com/"
          target="_blank"
          rel="noopener"
        >
          daisyUI
        </a>
      </nav>

      <nav>
        <h6 class="footer-title">{{ $t('footer.thanks') }}</h6>
        <a
          class="link link-hover"
          href="https://www.fargorate.com/"
          target="_blank"
          rel="noopener"
        >
          FargoRate
        </a>
        <a
          class="link link-hover"
          href="https://www.playcsipool.com/"
          target="_blank"
          rel="noopener"
        >
          CueSports International
        </a>
        <a
          class="link link-hover"
          href="https://github.com/"
          target="_blank"
          rel="noopener"
        >
          GitHub
        </a>
        <a
          class="link link-hover"
          href="https://claude.com/"
          target="_blank"
          rel="noopener"
        >
          Claude
        </a>
      </nav>
    </div>

    <!-- 2段目: 著作権情報（左寄せ）とリポジトリへの導線（右寄せ）。 -->
    <div class="border-base-300 border-t">
      <div
        class="text-base-content/70 container mx-auto flex items-center justify-between gap-2 px-4 py-2 text-xs"
      >
        <!--
          要素間の間隔は gap で作る。テンプレート上の改行はコンパイル時に
          除去されるため、空白文字に頼ると単語同士がくっつく。
        -->
        <p class="flex flex-wrap items-center gap-x-1">
          <span>&copy; 2026</span>
          <a
            class="link link-hover"
            href="https://hashimotoryoh.github.io"
            target="_blank"
            rel="noopener"
          >
            Ryoh Hashimoto
          </a>
        </p>

        <a
          class="btn btn-ghost btn-circle btn-sm"
          :href="repositoryUrl"
          target="_blank"
          rel="noopener"
          :aria-label="$t('footer.repository')"
        >
          <Icon name="fa7-brands:github" class="size-5" />
        </a>
      </div>
    </div>
  </footer>
</template>
