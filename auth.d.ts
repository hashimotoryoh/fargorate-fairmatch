import type { SessionPlayer } from './shared/types/player'

// nuxt-auth-utils がセッションに保存するユーザーの型。
// FargoRateで確認が取れたプレイヤーとゲストのどちらも入るため、両者の上位型を
// 継承する。どちらであるかは `kind` を見る `isFargoRatePlayer()` で判別する。
declare module '#auth-utils' {
  interface User extends SessionPlayer {}
}

export {}
