/**
 * FargoRateメンバーシップルックアップAPIのレスポンス。
 * レーティング系の項目は数値ではなく文字列で返ってくる点に注意。
 *
 * @see docs/fargorate-membership-lookup-api.md
 */
export type FargoRateLookupPlayer = {
  /**
   * FargoRateの表示用ID。桁数は一定しない。名前の代わりにこの値でも検索できる。
   * `membershipId`（このアプリでいうFargoRate ID）とは別物である。
   */
  readableId: string | null
  membershipId: string | null
  firstName: string
  lastName: string
  /** 所在地。空文字で返ることがある。 */
  location: string | null
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
  membershipId?: string
  location?: string | null
  robustness?: number
}

/**
 * FargoRateで確認が取れたプレイヤー。
 * 確認画面の表示と、認証済みユーザーのセッションの両方でこの型を使う。
 */
export type FargoRatePlayer = Player & {
  kind: 'fargorate'
  /** FargoRate側から姓名が必ず得られるため、ゲストと違って `null` にならない。 */
  name: string
  /**
   * メンバーシップID。UIでは「FargoRate ID」と表記する。FargoRateのAPIの
   * `membershipId` にあたる、桁数が一定しない数字列。
   */
  membershipId: string
  /**
   * FargoRateの表示用ID。レーティングを引き直すときの検索キーとして優先的に
   * 使い、無ければ名前で検索する。同一性の確認には使わない。
   */
  readableId: string | null
  /** 所在地。空文字で返ることがあるため `null` に寄せて持つ。 */
  location: string | null
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

/**
 * プレイヤー検索の結果1件。
 *
 * リンクの確認に使う `FargoRatePlayer` と違い、IDが欠けているプレイヤーが
 * 混じるため、`membershipId` は `null` を取りうる。
 */
export type FargoRateSearchResult = Player & {
  name: string
  /**
   * FargoRateの表示用ID。桁数は一定しない。リンクに使うFargoRate ID
   * （`membershipId`）とは別物なので、取り違えないこと。
   */
  readableId: string | null
  membershipId: string | null
  location: string | null
  robustness: number
}
