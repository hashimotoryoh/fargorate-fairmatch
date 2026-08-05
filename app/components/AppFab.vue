<script setup lang="ts">
// ヘッダーのナビゲーションと同じ条件（認証済み）で、どのページでも出す。
const { loggedIn } = useUserSession()

const localePath = useLocalePath()
</script>

<template>
  <!--
    主要ナビゲーションのスピードダイヤル。スマホ幅だけで使い、デスクトップ幅は
    ヘッダーのタブが同じ導線を担う。`sm:hidden` は Tailwind の utilities
    レイヤー、`fab` は daisyUI の components レイヤーなので `!` なしで打ち消せる。
  -->
  <div v-if="loggedIn" class="sm:hidden">
    <nav class="fab fab-flower">
      <!-- daisyUIのFABはフォーカスの有無で開閉するため、トリガーはボタン扱いのdivにする。 -->
      <div
        tabindex="0"
        role="button"
        class="btn btn-primary btn-circle btn-lg"
        :aria-label="$t('nav.open')"
      >
        <Icon name="heroicons:bars-3" class="size-6" />
      </div>

      <!--
        アイコンだけのボタンなので、名称はツールチップと読み上げ用ラベルで補う。
        最初の項目はトリガーの真横（180度）に開くため、ツールチップを上に
        出すと斜め上の項目と重なる。この項目だけ左に出す。
      -->
      <div
        v-for="(item, index) in mainNavItems"
        :key="item.to"
        class="tooltip"
        :class="{ 'tooltip-left': index === 0 }"
        :data-tip="$t(item.labelKey)"
      >
        <NuxtLink
          :to="localePath(item.to)"
          class="btn btn-circle btn-lg"
          :aria-label="$t(item.labelKey)"
        >
          <Icon :name="item.icon" class="size-6" />
        </NuxtLink>
      </div>
    </nav>

    <!--
      FAB（btn-lg + bottom: 1rem）はfixedで浮くため、ページ末尾のコンテンツや
      フッター右下の導線が隠れないよう、流し込みの余白をここで確保する。
      セーフエリアを足すのは、iPhone のホームインジケーターの分だけ隠れるのを
      避けるため。
    -->
    <div
      class="h-[calc(4rem+env(safe-area-inset-bottom))]"
      aria-hidden="true"
    />
  </div>
</template>
