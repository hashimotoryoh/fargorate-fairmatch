/**
 * `/link` の確認画面に見せるプレイヤー情報を、FargoRate IDから引く。
 * この時点ではまだセッションを作らない。該当が無ければ 404 を返す。
 *
 * リンクの導線のためのルートである。検索そのものは `lookupPlayerProfile` に
 * あるので、他の機能から同じ検索を使うときはその関数を共有し、ルートは機能ごとに
 * 分けること。分ける理由は次のreCAPTCHAの扱いにある。
 *
 * 外部APIへの総当たりを防ぐため、reCAPTCHA v3 の検証をここで行う。アクション名は
 * 呼び出し元の機能を表す `link` で、値はここに直書きする。クライアントから受け取ると
 * 「そのトークンは他の画面向けに取得したものではないか」の判定が骨抜きになるため。
 * ルートを機能ごとに分けておけば、アクション名をサーバー側で固定したまま、機能ごとの
 * スコア分布をreCAPTCHAの管理コンソールで見分けられる。
 *
 * `POST /api/auth/session` にはreCAPTCHAを付けていない。UI上は「最近使用した
 * アカウント」からの直接リンク（`selectRecentAccount`）がここを経由せず
 * `auth/session` を呼ぶが、`auth/session` はこのUI経路の有無に関わらず以前から
 * 直接叩けるエンドポイントであり、この経路が総当たりの窓口を新たに増やすもの
 * ではない。`auth/session` 側の対策が要るなら、reCAPTCHAとは別に検討すること。
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const fargorateId = readFargorateId(body)
  await verifyRecaptchaToken(body?.recaptchaToken, 'link')
  const profile = await lookupPlayerProfile(fargorateId)

  if (!profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Player not found',
    })
  }

  return profile
})
