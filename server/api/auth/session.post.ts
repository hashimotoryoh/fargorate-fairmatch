/**
 * ユーザーが確認画面で「これは自分だ」と答えたときに認証を確定する。
 *
 * クライアントから受け取る名前とメンバーシップIDは検索の鍵としてだけ使い、
 * セッションに保存するプレイヤー情報はサーバー側でルックアップし直した結果を
 * 使う。名前を受け取るのはFargoRateのAPIが名前でしか検索できないためで、
 * 保存する名前もレーティングもAPIの応答から取る。実在のプレイヤーとメンバー
 * シップIDが一致しない限りセッションは作られないため、クライアントが任意の
 * 名前やレーティングを自称することはできない。この方針を崩さないこと。
 *
 * サインアウトは nuxt-auth-utils 内蔵の DELETE /api/_auth/session を使うので
 * ここでは実装しない。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const name = readPlayerName(body)
  const membershipId = readMembershipId(body)
  const profile = await lookupPlayerProfile(name, membershipId)

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Player not found',
    })
  }

  await setUserSession(event, { user: profile })

  return profile
})
