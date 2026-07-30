import type { PlayerProfile } from './shared/types/player'

// nuxt-auth-utils がセッションに保存するユーザーの型。
// ルックアップで確認が取れたプレイヤー情報をそのまま認証情報として扱う。
declare module '#auth-utils' {
  interface User extends PlayerProfile {}
}

export {}
