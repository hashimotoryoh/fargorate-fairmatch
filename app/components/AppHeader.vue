<script setup lang="ts">
// ナビゲーションの有無はセッションではなくレイアウトの都合で決まる。
// `/` は認証済みでも紹介ページのままなので、ここで `loggedIn` を見てはいけない。
const { showNav = false } = defineProps<{ showNav?: boolean }>()

const localePath = useLocalePath()
</script>

<template>
  <!-- z-30 はドック（z-index: 1）より上、モーダル（999）より下に置くための値。 -->
  <header
    class="navbar bg-base-200 sticky top-0 z-30 min-h-14 gap-2 px-2 sm:px-4"
  >
    <div class="navbar-start">
      <NuxtLink
        :to="localePath('/')"
        class="btn btn-ghost gap-2 px-2 text-sm font-bold sm:text-base"
      >
        <AppLogo class="text-primary size-7 shrink-0" />
        <span>FargoRate FairMatch</span>
      </NuxtLink>
    </div>

    <nav v-if="showNav" class="navbar-end hidden sm:flex">
      <ul class="menu menu-horizontal gap-1 px-1">
        <li v-for="item in mainNavItems" :key="item.to">
          <NuxtLink :to="localePath(item.to)" active-class="menu-active">
            {{ $t(item.labelKey) }}
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </header>
</template>
