<template>
  <!--
    min-h-dvh と flex-1 の組み合わせで、コンテンツが短くてもフッターが
    画面の最下部に張り付く。dvh を使うのはモバイルSafariのアドレスバーの
    伸縮でフッターがはみ出すのを避けるため。
  -->
  <div class="flex min-h-dvh flex-col">
    <AppHeader />

    <main class="container mx-auto w-full flex-1 p-4">
      <slot />
    </main>

    <AppFooter />
    <!-- ヘッダーのナビゲーションと同じく、認証済みならどのページでも出す。 -->
    <AppFab />
  </div>
</template>
