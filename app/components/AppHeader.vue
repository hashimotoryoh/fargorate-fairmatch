<script setup lang="ts">
// ナビゲーションの有無はセッションではなくレイアウトの都合で決まる。
// `/` は認証済みでも紹介ページのままなので、ここで `loggedIn` を見てはいけない。
const { showNav = false } = defineProps<{ showNav?: boolean }>()

const localePath = useLocalePath()
</script>

<template>
  <!-- z-30 はFABとモーダル（どちらも z-index: 999）より下に置くための値。 -->
  <header
    class="navbar bg-base-200 sticky top-0 z-30 min-h-14 gap-2 px-2 sm:px-4"
  >
    <div class="navbar-start">
      <NuxtLink
        :to="localePath('/')"
        class="btn btn-ghost gap-2 px-2 text-sm font-bold sm:text-base"
      >
        <Icon name="custom:app-logo" class="text-primary size-7 shrink-0" />
        <span>FargoRate FairRace</span>
      </NuxtLink>
    </div>

    <!-- スマホ幅では同じ導線をFAB（スピードダイヤル）が担うため、タブは出さない。 -->
    <nav v-if="showNav" class="navbar-center hidden sm:flex">
      <div role="tablist" class="tabs tabs-border">
        <NuxtLink
          v-for="item in mainNavItems"
          :key="item.to"
          role="tab"
          class="tab gap-1.5"
          active-class="tab-active"
          :to="localePath(item.to)"
        >
          <Icon :name="item.icon" class="size-4" />
          {{ $t(item.labelKey) }}
        </NuxtLink>
      </div>
    </nav>

    <!--
      プレイヤー検索とテーマ・言語の切り替えはどのページからも要るため、
      `navbar-end` の中身は `showNav` によらず出す。
    -->
    <div class="navbar-end gap-1 sm:gap-2">
      <div class="tooltip tooltip-bottom" :data-tip="$t('nav.lookup')">
        <NuxtLink
          :to="localePath('/lookup')"
          class="btn btn-ghost btn-circle btn-sm"
          :aria-label="$t('nav.lookup')"
        >
          <Icon name="heroicons:users" class="size-5" />
        </NuxtLink>
      </div>

      <ThemeSwitcher />
      <LocaleSwitcher />
    </div>
  </header>
</template>
