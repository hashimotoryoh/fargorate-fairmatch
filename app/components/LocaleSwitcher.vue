<script setup lang="ts">
/**
 * 表示言語を切り替えるドロップダウン。
 *
 * 選択肢は `nuxt.config.ts` の `i18n.locales` から作る。言語を増やす作業を
 * 設定と翻訳ファイルの追加だけで完結させるため、ここに言語を書かない。
 */
const { locale } = useI18n()
const switchLocalePath = useSwitchLocalePath()
const localeOptions = useLocaleOptions()

// daisyUIのドロップダウンはフォーカスの有無で開閉するため、
// 選んだ後にフォーカスを外して明示的に閉じる。
function close() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur()
  }
}
</script>

<template>
  <div class="dropdown dropdown-end">
    <div
      tabindex="0"
      role="button"
      class="btn btn-ghost btn-circle btn-sm w-auto gap-0.5 px-2"
      :aria-label="$t('locale.switchLabel')"
    >
      <Icon name="heroicons:globe-alt" class="size-5" />
      <Icon name="heroicons:chevron-down" class="size-3" />
    </div>

    <ul
      tabindex="0"
      class="dropdown-content menu bg-base-100 rounded-box z-1 mt-1 w-40 p-2 shadow-sm"
    >
      <!--
        表示名は各言語の自称表記のままにする。翻訳すると、読めない言語に
        切り替えてしまった人が元の言語を見つけられなくなる。
      -->
      <li v-for="item in localeOptions" :key="item.code">
        <NuxtLink
          :to="switchLocalePath(item.code)"
          :class="{ 'menu-active': item.code === locale }"
          @click="close"
        >
          <span aria-hidden="true">{{ item.flag }}</span>
          <span>{{ item.name }}</span>
        </NuxtLink>
      </li>
    </ul>
  </div>
</template>
