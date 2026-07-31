<script setup lang="ts">
const { commitSha, repositoryUrl } = useRuntimeConfig().public

// GitHub上の表示に合わせて先頭7桁だけを見せる。
const shortCommitSha = computed(() => commitSha.slice(0, 7))
</script>

<template>
  <footer class="bg-base-200 border-base-300 border-t">
    <!--
      daisyUI の footer は「中央に著作権・右端にバージョン」を素直に表現できない
      （footer-center は全体を中央寄せしてしまう）ため、ユーティリティで組む。
      3カラムの1つ目を空にすることで、中央のセルがビューポートに対して中央に来る。
    -->
    <div
      class="text-base-content/70 container mx-auto flex flex-col items-center gap-1 p-4 text-xs sm:grid sm:grid-cols-3"
    >
      <span class="hidden sm:block" />

      <!--
        要素間の間隔は gap で作る。テンプレート上の改行はコンパイル時に
        除去されるため、空白文字に頼ると単語同士がくっつく。
      -->
      <p class="flex flex-wrap items-center justify-center gap-x-1">
        <span>&copy; 2026</span>
        <a
          class="link link-hover"
          href="https://hashimotoryoh.github.io"
          target="_blank"
          rel="noopener"
        >
          Ryoh Hashimoto
        </a>
        <span aria-hidden="true">&middot;</span>
        <a
          class="link link-hover"
          :href="`${repositoryUrl}/blob/main/LICENSE`"
          target="_blank"
          rel="noopener"
        >
          MIT License
        </a>
      </p>

      <p class="text-center sm:text-right">
        <a
          v-if="commitSha"
          class="link link-hover font-mono"
          :href="`${repositoryUrl}/commit/${commitSha}`"
          target="_blank"
          rel="noopener"
          :title="`コミット ${shortCommitSha} で動作しています`"
        >
          {{ shortCommitSha }}
        </a>
      </p>
    </div>
  </footer>
</template>
