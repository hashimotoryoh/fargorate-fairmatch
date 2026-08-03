/**
 * FargoRateのプレイヤーを検索し、ヒットした一覧を返す。`/lookup` から呼ぶ。
 * 該当が無いことは異常ではないため、404ではなく空配列を返す。
 *
 * 引くのはFargoRateのAPIだけで、CSIは経由しない。CSIはIDでしか引けず、この経路の
 * 主な入力は名前であるため。したがってリーグ・リージョン・チームは返らない。
 *
 * 検索語は `searchPlayers` がそのまま `q` に渡す。このAPIは姓名のほか、
 * レスポンスの `readableId` でも引ける。画面ではその使い方を案内していないが、
 * 入力を名前に限定する検証は入れないこと。
 *
 * リンクの導線（`POST /api/link/lookup`）とは別のルートにしてある。あちらは13桁の
 * FargoRate IDで1件に絞る確認のための経路で、こちらは複数件を返す一覧の経路であり、
 * 応答の形が違う。検索の実装は `server/utils/lookup.ts` を共有している。
 *
 * reCAPTCHAのアクションは呼び出し元の機能を表す `playerLookup` で、値はここに
 * 直書きする。機能ごとに分けておくと、管理コンソールでスコアの分布を機能ごとに
 * 見分けられ、しきい値も個別に調整できる。ただしアクション名はアクセス制御では
 * ない。総当たりを止めているのはスコアの方である。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = readPlayerQuery(body)
  await verifyRecaptchaToken(body?.recaptchaToken, 'playerLookup')

  return await searchPlayers(query)
})
