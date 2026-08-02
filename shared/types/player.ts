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
export type FargoRateLookupPlayer = {
  membershipId: string | null
  firstName: string
  lastName: string
  effectiveRating: string
  robustness: string
}

export type FargoRateLookupResponse = {
  value: FargoRateLookupPlayer[]
}

/**
 * 対戦に必要な最小限の情報。FargoRateで確認が取れたプレイヤーもゲストも
 * 共通で持つ。ゲームの処理はこの型だけに依存させ、認証の種別を意識せずに済む
 * ようにする。
 */
export type Player = {
  /**
   * 表示名。ゲストが入力を省略した場合は `null` になる。既定名は言語によって
   * 変わるため、セッションには保存せず表示側で補う。
   */
  name: string | null
  /** 対戦のハンデの算出に使うレーティング。 */
  rating: number
}

/**
 * セッションに保存されうるプレイヤー。`#auth-utils` の `User` はこの型を継承する。
 *
 * `FargoRatePlayer | GuestPlayer` のユニオンで表せると素直だが、`User` は
 * インターフェースであり、インターフェースはユニオン型を継承できない。そのため
 * 両者の上位型をここに置き、絞り込みは `isFargoRatePlayer()` で行う。
 */
export type SessionPlayer = Player & {
  /**
   * 認証の種別。ゲストは名前もレーティングも自己申告であり、FargoRateで確認が
   * 取れたプレイヤーと取り違えてはならない。項目の有無のような構造での判別に
   * 頼らず、明示的な判別子で区別する。
   */
  kind: 'fargorate' | 'guest'
  fargorateId?: string
  leagueName?: string | null
  region?: string | null
  teamNames?: string | null
  robustness?: number
}

/**
 * 2つのAPIの結果を統合した、FargoRateで確認が取れたプレイヤー。
 * 確認画面の表示と、認証済みユーザーのセッションの両方でこの型を使う。
 */
export type FargoRatePlayer = Player & {
  kind: 'fargorate'
  /** FargoRate側から姓名が必ず得られるため、ゲストと違って `null` にならない。 */
  name: string
  /** FargoRate ID。CSIの MembershipNumber、FargoRateの membershipId にあたる13桁の数値。 */
  fargorateId: string
  leagueName: string | null
  region: string | null
  teamNames: string | null
  /** レーティングの信頼度。 */
  robustness: number
}

/**
 * FargoRate IDを持たないユーザー。名前とレーティングの自己申告だけで成り立ち、
 * FargoRate固有の項目は型として持たない。
 */
export type GuestPlayer = Player & {
  kind: 'guest'
}
