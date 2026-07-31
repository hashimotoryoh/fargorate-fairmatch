const LOOKUP_PATH = '/lookup'

// 未認証のユーザーはルックアップページへ送り、
// 認証済みのユーザーがルックアップページへ来た場合はトップページへ戻す。
export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value && to.path !== LOOKUP_PATH) {
    return navigateTo(LOOKUP_PATH)
  }

  if (loggedIn.value && to.path === LOOKUP_PATH) {
    return navigateTo('/')
  }
})
