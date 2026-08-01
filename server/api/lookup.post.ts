/**
 * FargoRate IDからプレイヤー情報を引く。確認画面に見せるためのもので、
 * この時点ではまだ認証は行わない。該当が無ければ 404 を返す。
 *
 * 外部APIへの総当たりを防ぐため、reCAPTCHA v3 の検証をここで行う。
 * `auth/session` 側はここを通過した画面遷移でしか呼ばれないため付けていない。
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
