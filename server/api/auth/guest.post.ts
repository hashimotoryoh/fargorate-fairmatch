/**
 * FargoRate IDを持たないユーザーの認証を確定する。
 *
 * FargoRate側（`auth/session`）はクライアントからIDだけを受け取り、セッションに
 * 保存する情報はサーバーで引き直す。ゲストは引き直す先が無く自己申告を受け入れる
 * しかないため、同じハンドラーには相乗りさせず別のルートに分けてある。こうして
 * おけば、IDを送るだけで自称の姓名やレーティングを紛れ込ませる経路が生まれない。
 *
 * 自己申告であることは `kind: 'guest'` としてセッションに残り、表示側はこれを見て
 * FargoRateで確認が取れた値と区別する。
 *
 * reCAPTCHAは付けない。`lookup` に付けているのは非公式の外部APIへの総当たりを
 * 防ぐためであり、このルートは外部APIを一切呼ばないため理由が当てはまらない。
 *
 * サインアウトは nuxt-auth-utils 内蔵の DELETE /api/_auth/session を使うので
 * ここでは実装しない。
 */
export default defineEventHandler(async (event) => {
  const player = readGuestPlayer(await readBody(event))

  await setUserSession(event, { user: player })

  return player
})
