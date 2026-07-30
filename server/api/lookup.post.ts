/**
 * FargoRate IDからプレイヤー情報を引く。確認画面に見せるためのもので、
 * この時点ではまだ認証は行わない。該当が無ければ 404 を返す。
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

  return profile
})
