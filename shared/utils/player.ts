import type { FargoRatePlayer, SessionPlayer } from '#shared/types/player'

/**
 * セッションのプレイヤーがFargoRateで確認が取れた側かを判別する。
 *
 * `robustness` の有無のような項目の存在チェックではなく `kind` を見る。
 * ゲストが自己申告した値を、確認済みの値と取り違えないようにするため。
 */
export function isFargoRatePlayer(
  player: SessionPlayer,
): player is FargoRatePlayer {
  return player.kind === 'fargorate'
}
