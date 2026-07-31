// 認証が必要なページに付ける。未認証ならルックアップページへ送る。
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    return
  }

  // サインインを終えたあとに元のページへ戻せるよう、行き先を残しておく。
  return navigateTo({ path: '/lookup', query: { redirect: to.fullPath } })
})
