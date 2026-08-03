// 認証済みのユーザーには不要なページに付ける。リンクページとゲストページが対象。
export default defineNuxtRouteMiddleware(() => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value) {
    return navigateTo(useLocalePath()('/dashboard'))
  }
})
