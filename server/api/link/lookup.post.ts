/**
 * `/link` の確認画面に見せるプレイヤー情報を、FargoRate IDから引く。
 * この時点ではまだセッションを作らない。該当が無ければ 404 を返す。
 *
 * リンクの導線のためのルートである。IDで1件に絞る確認のための経路であり、名前で
 * 複数件を返す `POST /api/players/lookup` とは応答の形が違うため別に立ててある。
 * 検索そのものは `lookupPlayerProfile` にあるので、他の機能から同じ検索を使う
 * ときはその関数を共有し、ルートは機能ごとに分けること。
 *
 * 外部APIへの総当たりを防ぐため、reCAPTCHA v3 のスコア判定をここで行う。アクション名は
 * 呼び出し元の機能を表す `link` で、値はここに直書きする。機能ごとに分けておくと、
 * 管理コンソールでスコアの分布を機能ごとに見分けられ、しきい値も個別に調整できる。
 * ただしアクション名はアクセス制御ではない。サイトキーは公開値でアクションを決めるのは
 * クライアントなので、目的のアクションのトークンは誰でも発行できる。総当たりを止めて
 * いるのはスコアの方であり、アクション名に強度を期待しないこと。
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
