/**
 * FargoRateレースAPIのレスポンスの1件。
 *
 * @see docs/fargorate-races-api.md
 */
export type FargoRateRace = {
  /** レーティングが高い側の必要セット数。 */
  highPlayerRaceTo: number
  /** レーティングが低い側の必要セット数。 */
  lowPlayerRaceTo: number
  delta: number
  /** 最も公平な候補にだけ true が付く。UIのおすすめに使う。 */
  closest: boolean
}

/**
 * セット数の候補を「自分と相手」の向きへ正規化したもの。
 * どちらのレーティングが高いかをクライアントに意識させないための形。
 */
export type RaceOption = {
  playerRaceTo: number
  opponentRaceTo: number
  recommended: boolean
}
