/**
 * ユーザーが確認画面で「これは自分だ」と答えたときに認証を確定する。
 *
 * クライアントから受け取るのはFargoRate IDだけで、セッションに保存する
 * プレイヤー情報はサーバー側でルックアップし直したものを使う。
 * クライアントが任意の名前やレーティングを自称できないようにするため。
 *
 * サインアウトは nuxt-auth-utils 内蔵の DELETE /api/_auth/session を使うので
 * ここでは実装しない。
 */
export default defineEventHandler(async (event) => {
  const fargorateId = readFargorateId(await readBody(event))
  const profile = await lookupPlayerProfile(fargorateId)

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Player not found',
    })
  }

  await setUserSession(event, { user: profile })

  return profile
})
