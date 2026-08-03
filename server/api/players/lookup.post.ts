/**
 * 名前でFargoRateのプレイヤーを検索し、ヒットした一覧を返す。`/lookup` から呼ぶ。
 * 該当が無いことは異常ではないため、404ではなく空配列を返す。
 *
 * 入力が13桁のFargoRate IDだったときは、名前ではなくIDでの検索に切り替える。
 * FargoRateのAPIは名前でしか引けないため、CSIを経由する `lookupPlayerProfile`
 * を使う。画面ではこの経路を案内していないが、消さないこと。
 *
 * リンクの導線（`POST /api/link/lookup`）とは別のルートにしてある。あちらは
 * IDで1件に絞る確認のための経路で、こちらは名前で複数件を返す一覧の経路であり、
 * 応答の形が違う。検索そのものは `server/utils/lookup.ts` を共有している。
 *
 * reCAPTCHAのアクションは呼び出し元の機能を表す `playerLookup` で、値はここに
 * 直書きする。機能ごとに分けておくと、管理コンソールでスコアの分布を機能ごとに
 * 見分けられ、しきい値も個別に調整できる。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = readPlayerQuery(body)
  await verifyRecaptchaToken(body?.recaptchaToken, 'playerLookup')

  if (isValidFargorateId(query)) {
    const profile = await lookupPlayerProfile(query)

    return profile ? [toSearchResultFromProfile(profile)] : []
  }

  return await searchPlayersByName(query)
})
