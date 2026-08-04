/**
 * 2人のレーティングから公平なセット数の候補を返す。フェアセットマッチの
 * ブリーフィング（ゲーム設定）から呼ぶ。
 *
 * 関門はセッションのみで、reCAPTCHAは付けない。認証必須ページからしか
 * 呼ばれず、セッションを作る経路（リンクとゲスト）の両方がreCAPTCHAを
 * 通っているため。同じ組み合わせの問い合わせは `fetchRaces` のキャッシュが
 * 吸収する。
 */
export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const query = getQuery(event)
  const playerRating = readRatingParam(query.playerRating, 'playerRating')
  const opponentRating = readRatingParam(query.opponentRating, 'opponentRating')

  return await raceOptionsFor(playerRating, opponentRating)
})
