/**
 * FargoRate IDを持たないユーザーの認証を確定する。
 *
 * FargoRate側（`auth/session`）はクライアントからIDだけを受け取り、セッションに
 * 保存する情報はサーバーで引き直す。ゲストは引き直す先が無く自己申告を受け入れる
 * しかないため、同じハンドラーには相乗りさせず別のルートに分けてある。こうして
 * おけば、IDを送るだけで自称の名前やレーティングを紛れ込ませる経路が生まれない。
 *
 * 自己申告であることは `kind: 'guest'` としてセッションに残り、表示側はこれを見て
 * FargoRateで確認が取れた値と区別する。
 *
 * reCAPTCHAを付けるかどうかは「外部APIを呼ぶか」ではなく「ボットに攻撃されうるか」で
 * 決める。このルートは外部APIを呼ばないが、未認証で誰でも叩けてセッションを無制限に
 * 発行できる。そのセッションは `POST /api/players/lookup` のreCAPTCHAを免れる鍵にも
 * なるため、ここを素通しにすると外部APIへの総当たりの入口が開く。
 *
 * サインアウトは nuxt-auth-utils 内蔵の DELETE /api/_auth/session を使うので
 * ここでは実装しない。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const player = readGuestPlayer(body)
  await verifyRecaptchaToken(body?.recaptchaToken, 'guest')

  await setUserSession(event, { user: player })

  return player
})
