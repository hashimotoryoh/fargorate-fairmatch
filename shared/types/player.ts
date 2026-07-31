/**
 * CSIメンバーシップルックアップAPIのレスポンス。
 * 実際にはより多くの項目が返るが、このアプリで利用するものだけを定義している。
 * フィールド名は外部サービスの仕様どおりPascalCaseのままとする。
 *
 * @see docs/csi-membership-lookup-api.md
 */
export type CsiMember = {
  MembershipNumber: string
  FirstName: string
  LastName: string
  LeagueName: string | null
  Region: string | null
  TeamNames: string | null
}

export type CsiLookupResponse = {
  data: CsiMember[]
  total: number
}

/**
 * FargoRateメンバーシップルックアップAPIのレスポンス。
 * レーティング系の項目は数値ではなく文字列で返ってくる点に注意。
 *
 * @see docs/fargorate-membership-lookup-api.md
 */
export type FargoRatePlayer = {
  membershipId: string | null
  firstName: string
  lastName: string
  effectiveRating: string
  robustness: string
}

export type FargoRateLookupResponse = {
  value: FargoRatePlayer[]
}

/**
 * 2つのAPIの結果を統合した、アプリ内で扱うプレイヤー情報。
 * 確認画面の表示と、認証済みユーザーのセッションの両方でこの型を使う。
 */
export type PlayerProfile = {
  /** FargoRate ID。CSIの MembershipNumber、FargoRateの membershipId にあたる13桁の数値。 */
  fargorateId: string
  firstName: string
  lastName: string
  leagueName: string | null
  region: string | null
  teamNames: string | null
  /** 現在のレーティング。 */
  effectiveRating: number
  /** レーティングの信頼度。 */
  robustness: number
}
