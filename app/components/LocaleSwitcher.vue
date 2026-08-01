<script setup lang="ts">
/**
 * 表示言語を切り替えるセレクトボックス。
 *
 * 選択肢は `nuxt.config.ts` の `i18n.locales` から作る。言語を増やす作業を
 * 設定と翻訳ファイルの追加だけで完結させるため、ここに言語を書かない。
 */
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()

async function change(event: Event) {
  const code = (event.target as HTMLSelectElement).value

  await navigateTo(switchLocalePath(code as typeof locale.value))
}
</script>

<template>
  <select
    class="select select-sm w-auto"
    :value="locale"
    :aria-label="$t('locale.switchLabel')"
    @change="change"
  >
    <!--
      表示名は各言語の自称表記のままにする。翻訳すると、読めない言語に
      切り替えてしまった人が元の言語を見つけられなくなる。
    -->
    <option v-for="item in locales" :key="item.code" :value="item.code">
      {{ item.name }}
    </option>
  </select>
</template>
