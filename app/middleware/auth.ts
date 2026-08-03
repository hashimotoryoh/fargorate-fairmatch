// 認証が必要なページに付ける。未認証ならリンクページへ送る。
export default defineNuxtRouteMiddleware((to) => {
  // このミドルウェアが付くページは非公開である。
  //
  // レイアウト側で noindex のメタタグも出しているが、メタタグは本文を返す応答に
  // しか乗らないため、未認証時のリダイレクトをカバーできない。ヘッダーもここで
  // 立てることで、「認証が必要」と「インデックスさせない」を definePageMeta の
  // 一つの宣言に紐づける。保護対象のパスを別の場所に列挙すると、ページを追加した
  // ときの更新漏れがそのまま露出になる。
  useResponseHeader('x-robots-tag').value = 'noindex, nofollow'

  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    return
  }

  // リンクを終えたあとに元のページへ戻せるよう、行き先を残しておく。
  // 送り先はロケールを保つ。英語で読んでいた人を日本語のページへ送ると、
  // リンクの手前で読めない画面に突き当たる。
  return navigateTo({
    path: useLocalePath()('/link'),
    query: { redirect: to.fullPath },
  })
})
