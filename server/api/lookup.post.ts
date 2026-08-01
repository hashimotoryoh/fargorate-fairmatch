/**
 * FargoRate IDからプレイヤー情報を引く。確認画面に見せるためのもので、
 * この時点ではまだ認証は行わない。該当が無ければ 404 を返す。
 *
 * 外部APIへの総当たりを防ぐため、reCAPTCHA v3 の検証をここで行う。
 * `auth/session` 側には付けていない。UI上は「最近使用したアカウント」からの
 * 直接サインイン（`selectRecentAccount`）がここを経由せず`auth/session`を
 * 直接呼ぶが、`auth/session`自体はこのUI経路の有無に関わらず以前から直接
 * 呼び出せるエンドポイントであり、このPRが新たに総当たりの経路を追加する
 * ものではない。`auth/session`側の総当たり対策が要るなら、reCAPTCHAとは
 * 別に検討すること。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const fargorateId = readFargorateId(body)
  await verifyRecaptchaToken(body?.recaptchaToken, 'lookup')
  const profile = await lookupPlayerProfile(fargorateId)

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Player not found',
    })
  }

  return profile
})
