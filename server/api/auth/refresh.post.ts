/**
 * セッションのプレイヤーをFargoRateへ問い合わせ直し、最新の値で保存し直す。
 * ゲーム設定に入るときに呼び、古いレーティングが公平なセット数の算出に
 * 使われるのを防ぐ。
 *
 * ボディは読まない。引き直す対象はセッションが持つ本人だけで、クライアントが
 * 別のプレイヤーを指定する余地を作らないため。検索キーには `readableId` を
 * 優先し、見つからなければ名前で引き直す。ゲストは自己申告の値しか持たない
 * ため、外部へは問い合わせずそのまま返す。
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)

  if (!isFargoRatePlayer(user)) {
    return user
  }

  const profile =
    (await lookupPlayerProfile(
      user.readableId ?? user.name,
      user.membershipId,
    )) ??
    (user.readableId
      ? await lookupPlayerProfile(user.name, user.membershipId)
      : null)

  // 見つからなくても既存の値で続行させる。外部APIの応答の揺れでゲームの
  // 開始を止めないため。
  if (!profile) {
    return user
  }

  await setUserSession(event, { user: profile })

  return profile
})
