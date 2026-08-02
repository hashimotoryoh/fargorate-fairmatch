# AGENTS.md

このファイルは、このリポジトリで作業するAIコーディングエージェント向けの共通ガイドである。対象は次のとおり。

- Claude Code
- GitHub Copilot
- Codex
- その他全てのエージェント

エージェントへのガイドの一意性を担保するため、次のファイルはこのファイルへのシンボリックリンクである。

- `CLAUDE.md`
- `.github/copilot-instructions.md`

特定のツール固有の記述は避け、実体はこのファイル一つに保ち、どのエージェントが読んでも成立する内容にする。別のエージェント向けのガイドファイルが新たに必要になった場合も、実体は作らずこのファイルへのシンボリックリンクを追加すること。

## リポジトリ

### エージェントがユーザーに向けて使う言語

このリポジトリでエージェントが生成するすべての記述は、原則として日本語にすること。対象には、次を含む。

- チャットでの説明文
- コードコメント
- コミットメッセージ
- PRのタイトル・本文
- レビューコメント
- Issueのタイトル・本文
- ドキュメント本文

ただし、次は変更せずそのまま利用する。

- 既存コードの識別子（変数名・関数名・クラス名など）
- ライブラリ名・プロトコル名・設定キー
- エラーメッセージや外部サービス仕様で英語原文が必要な箇所

ユーザーが明示的に別言語を指定した場合のみ、その指定を優先すること。

なお、全角スペースは使わないこと。インデントや字下げ、単語の区切りにも用いない。

### ドキュメント品質

`README.md` やこのファイル `AGENTS.md` など全てのドキュメントファイルもプロジェクトのコード変更に追従すること。アーキテクチャの変更や、エージェントがドキュメントに追記した方が良いと判断する変更がある場合は、これらのファイルも変更すること。

役割の使い分けは次のとおり。

- `README.md`: 人間の開発者向け。セットアップ手順や各コマンドなど、人間が最初に読む情報
- `AGENTS.md`: エージェント向け。作業時の規約や判断基準
- `docs/`: 外部仕様の調査結果などのメモ

MarkdownもPrettierの整形対象であるため、ドキュメントを変更した場合も後述のチェックを実行すること。

### コミット

コミットは変更内容に応じて細かく分け、後から参照しやすくすること。1つのコミットには1つの意図だけを含め、無関係な整形やリファクタリングを混ぜないこと。

コミットメッセージは日本語の1行要約を基本とし、「〜を追加」「〜を修正」のように何をしたかがわかる形にする。補足が必要な場合のみ本文を追加すること。

### ブランチとプルリクエスト

`main` へ直接コミットせず、必ず作業用ブランチを作成すること。

プルリクエストのタイトル・本文は日本語で書き、本文には次を含めること。

- 変更の目的と背景
- 変更内容の概要
- 動作確認の方法や結果

### 秘密情報と個人情報

- `.env` および `.env.*` は `.gitignore` の対象である。認証情報やトークンをコードやドキュメントに直接書かないこと
- `docs/` 配下の外部API調査メモには、実在するプレイヤーの氏名やメンバーシップ番号が例として含まれる。新たに調査結果を追記する場合は、Cookieや認証ヘッダーなどのセッション情報を残さないこと
- `public/img/fargorate-id-*.png` は本人以外の顔が写り込んだスクリーンショットである。扱いは後述の「スクリーンショットを使った案内」に従うこと

### ライセンス

MITライセンスで公開している。`LICENSE` はライセンスの定型文であり、英語の原文をそのまま置くこと。ライセンスを変更する場合は `LICENSE`、`package.json` の `license`、フッターの表記（`app/components/AppFooter.vue`）の3か所を揃えること。

## アプリケーション概要

FargoRateを用いたビリヤード対戦を補助するウェブアプリ。対戦中のスコアの入力や、対戦成績の振り返りなどを補助する。

このアプリは、ユーザーのFargoRateを公式システムからAPI経由で取得して扱うが、対戦結果をそのシステムには送信せずレーティングの更新は行わない。

### FargoRate

世界中のポケットビリヤードプレイヤーの強さを同じ基準で数値化して表す、世界共通のレーティングシステムである。

基本的な仕組みは次のとおり。

- 相対評価: 対戦相手との「勝敗」や「得点差」のデータを積み上げて数値を決めるイロレーティング方式
- 世界共通の尺度: 国や地域、リーグによらず全ての対戦データを一元管理しているため、理論的には離れた場所にいるプレイヤー同士でも同じ基準で強さを比べることができるが、現実的には対戦データは近隣のプレイヤー同士のものがほとんどの割合を占めるため、離れた場所の同レーティングのプレイヤー間の実力には小さからず差がある
- 自動更新: 提携しているリーグや大会の結果がシステムに送られると、自動的に数値が更新される

数値の目安は次のとおり。

- 初級者（カジュアルなプレイヤー）: 100 ~ 300台
- 中級者（一般的なアマチュアリーグプレイヤー）: 400 ~ 500台
- 上級者（アマチュアの上位層）: 600台
- 一流のプロ: 700台
- 世界トッププロ: 800台

### 外部API

利用する外部APIの調査結果は `docs/` にまとめている。実装前に必ず参照すること。

- `docs/fargorate-membership-lookup-api.md`: FargoRateのプレイヤー検索
- `docs/csi-membership-lookup-api.md`: CSIのメンバーシップ検索

いずれも公開ドキュメントのある公式APIではなく、ブラウザの通信を調査して判明したエンドポイントである。次を前提に扱うこと。

- 仕様が予告なく変わりうるため、レスポンスの形を信頼しすぎず、取得できなかった場合の挙動も実装すること
- 呼び出しはブラウザから直接行わず、Nuxtのサーバールート（`server/api/`）を経由させること。CORSの制約を受けるうえ、リクエストの詳細をアプリ側に閉じ込められる
- 不要なリクエストを繰り返さないこと。入力に応じて検索する場合はデバウンスやキャッシュを検討する
- 読み取りのみに使う。レーティングを更新する用途では使わない

## 技術スタック

- Nuxt v4
- Vue 3
- TypeScript
- Tailwind CSS v4
- daisyUI v5
- Nuxt Content v3
- Nuxt I18n v10
- Nuxt Icon v2

パッケージマネージャーはnpmを使用する。`package-lock.json` を管理しているため、yarnやpnpmに置き換えないこと。依存を追加した場合は `package.json` と `package-lock.json` の両方をコミットすること。

## セットアップ

Node.js のバージョンは `.node-version` に従うこと。

セットアップ方法は人間にも案内する必要があるため `README.md` に記載している。そちらを参照すること。

エージェントは作業を始める前に `npm install` を済ませておくこと。`postinstall` で `nuxt prepare` が走り、型定義やESLint設定を含む `.nuxt` が生成される。これがない状態ではESLintも型解決も正しく動作しない。`.nuxt` が失われている場合は `npx nuxt prepare` で再生成できる。

## ディレクトリ構成

- `app/`: アプリケーションのソース。Nuxt v4 の `srcDir`
  - `app/app.vue`: ルートコンポーネント
  - `app/app.config.ts`: 実行時に参照するアプリ設定。`@nuxt/icon` の描画モードなど
  - `app/components/`: コンポーネント。自動インポートの対象
  - `app/layouts/`: レイアウト
  - `app/pages/`: ページ。ファイル名がそのままルートになる
  - `app/middleware/`: ルートミドルウェア。`.global.ts` の接尾辞で全ルートに適用される
  - `app/utils/`: 汎用の関数。自動インポートの対象
  - `app/assets/css/main.css`: Tailwind CSS と daisyUI の読み込み口
  - `app/assets/icons/`: `@nuxt/icon` のカスタムコレクション（`custom:` プレフィックス）のSVG。アプリロゴなど既存のアイコンセットにない図形を置く
- `server/`: Nitroのサーバールート。プロジェクトルート直下に置く
  - `server/api/`: APIのエンドポイント。ファイル名の `.post.ts` などがHTTPメソッドに対応する
  - `server/utils/`: サーバールートから自動インポートされるユーティリティ
- `shared/`: クライアントとサーバーの双方から使う型やロジック。プロジェクトルート直下に置く
  - `shared/types/`: 双方から使う型定義
  - `shared/utils/`: 双方から使う関数。`app/` と `server/` の両方へ自動インポートされる
- `content/`: Nuxt Content が扱うMarkdown。プロジェクトルート直下に置く。直下は言語のディレクトリ。設定は `content.config.ts`
- `i18n/`: Nuxt I18n が読む翻訳。プロジェクトルート直下に置く
  - `i18n/locales/`: 言語ごとのメッセージ。`ja.json` と `en.json`
- `public/`: ビルドを経ずそのまま配信される静的ファイル
- `tests/`: Vitestのテスト。プロジェクトルート直下に置く
  - `tests/unit/`: 素のNode環境で動くテスト。純粋なロジックとサーバールート
  - `tests/nuxt/`: Nuxtのランタイムを立ち上げるテスト。コンポーネントとページ
  - `tests/helpers/`: テストから使う補助。フィクスチャやh3のハンドラー呼び出し
  - `tests/setup/`: テストの前処理。Nitroの自動インポートの補完とブラウザの言語の固定
- `docs/`: 外部APIの調査などのドキュメント
- `.github/workflows/`: GitHub Actions のワークフロー

次のディレクトリは必要になった時点で作成する。Nuxtの規約に沿った配置とすること。

- `app/composables/`: コンポーザブル。自動インポートの対象

`.nuxt` や `.output` は生成物であり、編集もコミットもしないこと。

## アーキテクチャ

### レイヤー構成

Nuxt v4の公式が推奨する構成に原則として則ること。

外部APIへのアクセスや秘匿すべき処理はサーバールートに置き、コンポーネントからはコンポーザブル経由で呼び出す。コンポーネントに通信処理を直接書かないこと。

`app/` と `server/` の双方から使う型やユーティリティは `shared/` に置き、`#shared/` エイリアスで参照する。

### 認証

認証には2つの経路がある。セッション管理には [Nuxt Auth Utils](https://github.com/atinux/nuxt-auth-utils) を使う。

- FargoRate ID（13桁の数値）のルックアップ
- ゲスト（IDを持たないユーザーの自己申告）

#### FargoRate IDでの認証

フローは次のとおり。

1. ユーザーが `/lookup` でFargoRate IDを入力する
2. CSIメンバーシップルックアップAPIをIDで検索し、姓名・リーグ・リージョン・チームを得る
3. その姓名でFargoRateメンバーシップルックアップAPIを検索し、メンバーシップIDの一致で1件に絞ってレーティングと信頼度を得る
4. 得られたプレイヤー情報をユーザーに見せ、本人かどうかを確認する
5. 本人だと確認できたらセッションに保存する

確認の確定時（`POST /api/auth/session`）にクライアントから受け取るのはFargoRate IDだけとし、セッションに保存する情報はサーバー側でルックアップし直した結果を使う。クライアントが任意の名前やレーティングを自称できないようにするため、この方針を崩さないこと。

#### ゲスト認証

FargoRate IDを持たないユーザーは `/guest` で名前とレーティングを入力してサインインする。名前は任意で、未入力なら `null` を保存し、表示時に `player.guestName` で補う。既定名は言語によって変わるため、翻訳した文字列をセッションへ焼き込まないこと。

レーティングの範囲は `shared/utils/guestPlayer.ts` の `GUEST_RATING_MIN` と `GUEST_RATING_MAX`（-90 〜 930）に一本化してある。USAPLが公開しているハンディキャップ計算ツール（https://usaplraceto.azurewebsites.net/）が受け付ける入力レンジに合わせたものである。フォームとサーバールートの双方でこの関数を使い、条件を二重に書かないこと。

ゲストは `POST /api/auth/guest` という別のルートに分けてある。`auth/session` に相乗りさせると、IDを送るだけのつもりの経路に自称の値が紛れ込む余地が生まれるためである。ハンドラーはボディを展開せず、`readGuestPlayer()` が読み取った項目だけでオブジェクトを組み立てる。`fargorateId` や `kind: 'fargorate'` を送られても効かないのはこのためで、`tests/unit/server/api/auth/guest.post.spec.ts` がそれを固定している。

このルートにreCAPTCHAは付けていない。`lookup` に付けているのは非公式の外部APIへの総当たりを防ぐためであり、ゲストは外部APIを一切呼ばないため理由が当てはまらない。

#### プレイヤーの型

`shared/types/player.ts` に4つ置いてある。

- `Player`: 名前とレーティングだけを持つ土台。ゲームの処理はこの型にだけ依存させ、認証の種別を意識せずに済むようにする
- `SessionPlayer`: セッションに入りうるプレイヤー。`#auth-utils` の `User` はこれを継承する
- `FargoRatePlayer`: FargoRateで確認が取れたプレイヤー
- `GuestPlayer`: 自己申告だけのゲスト

`FargoRatePlayer | GuestPlayer` のユニオンで表せると素直だが、`User` はインターフェースであり、インターフェースはユニオン型を継承できない。そのため両者の上位型として `SessionPlayer` を挟んである。

どちらであるかの判別には必ず `isFargoRatePlayer()`（`shared/utils/player.ts`）を使い、`robustness` や `fargorateId` の有無を見る形にしないこと。ゲストの自己申告値を、FargoRateで確認が取れた値と取り違えないためである。`GuestPlayer` がFargoRate固有の項目を型として持たないのも同じ理由による。

CSI・FargoRateの両APIは非公式で利用制約が不明なため、`POST /api/lookup`（IDを送って外部APIへ問い合わせる最初の関門）ではreCAPTCHA v3のスコア判定を通してから `lookupPlayerProfile` を呼ぶ（`server/utils/recaptcha.ts` の `verifyRecaptchaToken`）。クライアント側のトークン取得は `app/composables/useRecaptcha.ts` が担う。`POST /api/auth/session` は `lookup` を通過した画面遷移でしか呼ばれないため、reCAPTCHAは付けていない。

Googleが公開しているテストキー（`6LeIxAcT...`）はv2用であり、このアプリでは使えない。v2の `siteverify` の応答には `score` も `action` も含まれず、スコア判定で必ず落ちるためである。v3用のテストキーは公開されていないので、ローカル開発でも `localhost` をドメインに加えた自分のv3キーを使うこと。検証が通らないことを理由に `score` や `action` のチェックを緩めてはならない。

認証なしでアクセスできるのは `/`、`/lookup`、`/guest`、`/privacy-policy`、`/terms-conditions` の5つだけで、これは検索エンジンに開放するページと一致する。保護は名前付きミドルウェアで行う。

- `app/middleware/auth.ts`: 未認証なら `/lookup` へ送る。保護対象のページに `definePageMeta({ middleware: 'auth' })` で付ける
- `app/middleware/guest.ts`: 認証済みなら `/dashboard` へ送る。サインインの入口である `/lookup` と `/guest` に付ける。名前が同じだが、これは「未認証のユーザー」の意味であり、ゲスト認証とは別の概念である

保護対象のパスをどこかに配列で列挙する形にはしないこと。グローバルミドルウェアであれ `routeRules` であれ、ページを追加するたびに更新が必要になり、更新漏れがそのまま情報の露出になる。保護に関わる指定はすべてページ側の `definePageMeta` から辿れる状態に保つこと。

`auth.ts` はSSR時に `x-robots-tag: noindex, nofollow` も立てる。レイアウトの `noindex` メタタグは本文を返す応答にしか乗らず、未認証時のリダイレクトをカバーできないため。

`auth.ts` は元の行き先を `redirect` クエリに残し、サインイン後にそこへ戻す。この値はURLから誰でも与えられるため、必ず `resolveRedirectPath()`（`app/utils/navigation.ts`）を通してから `navigateTo` に渡すこと。外部サイトへ誘導するオープンリダイレクトを防ぐため。`/lookup` と `/guest` は互いへのリンクでもこのクエリを引き継ぐ。片方で行き先を落とすと、経路によって戻り先が変わってしまう。

保護ページには `prerender` や ISR・SWR のルートルールを付けないこと。Nuxt Auth Utils はプリレンダやキャッシュの際にサーバー側のセッション取得を飛ばすため、ミドルウェアが認証済みのユーザーを未認証と判定してしまう。

サインアウトはNuxt Auth Utils内蔵の `DELETE /api/_auth/session` を使う。

セッションの秘密鍵は環境変数 `NUXT_SESSION_PASSWORD` で与える。`.env.example` を参照すること。

### レイアウト

レイアウトは2つある。ヘッダーとフッターは共通で、`AppHeader` と `AppFooter` を両者から使う。

- `default`: 公開ページ（`/`、`/lookup`、`/privacy-policy`、`/terms-conditions`）用
- `authenticated`: 認証ページ（`/dashboard`、`/game`、`/settings`）用。スマホ幅でのみ `AppDock` を出し、デスクトップ幅ではヘッダーにナビゲーションを出す

`authenticated` には `noindex` をまとめて指定してある。保護ページとこのレイアウトが1対1に対応するため、ページごとに書くより追加漏れが起きない。保護ページを追加する際は `definePageMeta({ middleware: 'auth', layout: 'authenticated' })` を付けること。

ヘッダーのナビゲーションの有無は `showNav` の props で制御する。`useUserSession()` の `loggedIn` を見てはならない。`/` は認証済みでも紹介ページのままにする方針であり、ナビゲーションの有無は認証状態ではなくレイアウトの都合で決まるため。

### 多言語化

日本語（`ja`）と英語（`en`）に対応する。設定は `nuxt.config.ts` の `i18n` にまとめてある。

- URLの戦略は `prefix_except_default`。日本語は接頭辞なし、英語は `/en` を頭に付ける
- 初回はブラウザの言語で振り分ける。振り分けるのはトップページに来たときだけとし、言語を指定したURLは尊重する。全ページで振り分けると、共有された `/en/privacy-policy` を日本語話者が開いたときに読めない側へ飛ばされる
- 言語を増やす作業は、`i18n.locales` に1行足して `i18n/locales/<コード>.json` を置くだけで終わる状態に保つこと。`LocaleSwitcher` の選択肢は設定から作っており、言語名を書き並べた箇所を新たに作らないこと

文言は `i18n/locales/*.json` に置く。キーは画面やコンポーネント単位でネストし、テンプレートに現れる順に並べる。文言を足すときは必ず全ての言語に同じキーで足すこと。抜けは `fallbackLocale` に吸収されて別の言語の文面が混ざるだけなので、画面上は壊れて見えない。`tests/unit/repository/i18n.spec.ts` が過不足を検査する。

補間は名前付きのプレースホルダだけを使う。語順は言語で変わるため、「〜として〜しています」のような文は語の並びごと翻訳側に委ねること。

モジュールスコープの定数からは翻訳関数を呼べない。`app/utils/navigation.ts` のように定義時点で文言を決められない場所では、メッセージのキーを持ち、描画側で `$t()` に通すこと。

`useSeoMeta` に渡すページ固有のメタは、ロケールの切り替えに追随させるため値ではなくゲッター（`title: () => t('seo.index.title')`）で渡すこと。

リンクとリダイレクトの遷移先は `localePath()` に通し、ロケールを落とさないこと。対象は `NuxtLink` の `to`、ミドルウェアの `navigateTo`、サインイン後の復帰先である。`resolveRedirectPath()` はロケールを知らない純粋な関数のまま保ち、オープンリダイレクトの判定とロケールの付与を混ぜないこと。既にロケールを含むパスを `localePath()` に通しても二重には付かない。

SEOのメタタグは `app/app.vue` の `useLocaleHead()` がまとめて作る。`html` の `lang`、hreflang の alternate と `x-default`、canonical、`og:url`、`og:locale` が対象で、これらを手書きで足さないこと。言語を増やすたびに漏れる。

公開URLは `NUXT_PUBLIC_SITE_URL` の1つだけを読み、i18n の `baseUrl`・`site.url`・`runtimeConfig` の全てへ渡す。環境変数を分けると片方だけ設定された状態が起き、誤ったドメインを指す canonical が出る。この形は `tests/unit/repository/site-url.spec.ts` で固定してある。

### Markdownで管理するドキュメント

文面が主体で、改訂がアプリの挙動と関係しないページは [Nuxt Content](https://content.nuxt.com/) で管理し、実体を `content/` のMarkdownに置く。文面の改訂をコードの変更と切り離すためである。文面だけを直す場合はMarkdownのみを変更し、Vueのコードには触れないこと。

現在あるのはプライバシーポリシー（`/privacy-policy`）と利用規約（`/terms-conditions`）だが、同じ仕組みで別のドキュメントも足せる。特定のドキュメントに寄った名前を付けないこと。

- `content/ja/privacy-policy.md` が `/privacy-policy` に、`content/en/privacy-policy.md` が `/en/privacy-policy` に対応する。`content/` の直下は言語のディレクトリで、その中のファイル名がそのままルートになる
- ドキュメントは全ての言語に同じ名前で置くこと。片方の言語にしか無いと、その言語で開いたときだけ404になる
- ページ（`app/pages/privacy-policy.vue` など）は `MarkdownDocument` にパスを渡すだけの薄いものに保つ
- フロントマターには `title`・`description`・`updatedAt` を書く。`title` は見出しとタイトルタグ、`description` はメタタグ、`updatedAt` は最終更新日の表示に使う
- 見出しは `##` から始める。ページの `h1` は `title` から出しているため、本文に `#` を書くと見出しが重なる
- 文面を改訂したら `updatedAt` も改めること。文面が言語をまたぐ内容であれば、全ての言語を揃えて改訂すること
- フッターに出す場合は `app/utils/navigation.ts` の `documentNavItems` に足す

ドキュメントを追加する際は、Markdownとページに加えて、公開ページであれば `tests/unit/repository/page-protection.spec.ts` の `PUBLIC_PAGES` も更新すること。

コレクションは言語ごとに分けてある（`content.config.ts` の `documents_ja` と `documents_en`）。Nuxt Content はコレクションをまたいだ絞り込みを持たないためである。`source` の `prefix` を空にしてパスから言語を外してあるので、ページが渡すパスは言語によらず `/privacy-policy` のままでよい。`type: 'page'` が備える `description` は本来任意項目だが、メタタグに必ず出すためスキーマで必須にしてある。用途の異なるコンテンツを足す場合は、言語のディレクトリの下にさらにディレクトリを切り、コレクションを分けること。

プライバシーポリシーと利用規約は準拠法が日本法であるため、日英どちらにも「解釈に相違がある場合は日本語版を優先する」条項を置いてある。法務文書の翻訳を足す場合も同じ扱いにすること。

データベースの接続には Node.js 同梱の `node:sqlite` を使う設定にしてある（`nuxt.config.ts` の `content.experimental.sqliteConnector`）。既定のままでは `better-sqlite3` のインストールを対話的に促され、CIのビルドが止まるため、この指定を外さないこと。

### スクリーンショットを使った案内

`public/img/fargorate-id-*.png` には本人以外の顔が写り込んでいる。`ScreenshotFigure` で必要な範囲だけを切り出して使い、**顔がDOMに存在しない範囲までクロップすること**。切り出し範囲を変更する際は必ず写り込みがないことを確認すること。

ぼかしで隠す方法は採らない。`backdrop-filter` は祖先の `opacity` の影響を受け、モーダルはまさに `opacity` を遷移させるため、環境によっては素通しになりうる。

FargoRateアプリの表示言語は端末の設定に従うため、案内の画像も本来は言語ごとに撮り分ける必要がある。画像とクロップの座標は文言ではないので翻訳ファイルではなく `app/utils/lookupGuide.ts` に置き、ロケールで引く形にしてある。**英語版の画像はまだ用意できておらず、当面は日本語版を流用している。** 英語のスクリーンショットが揃ったら `en` の配列だけを差し替えること。

### コーディング規約

- Vueのコンポーネントは単一ファイルコンポーネントで書き、`<script setup lang="ts">` を用いたComposition APIとする。Options APIは使わない
- ファイル内の並びは `<script>`、`<template>`、`<style>` の順とする
- コンポーネント名はパスカルケースの複数語（例: `PlayerCard.vue`）とする
- Nuxtの自動インポートを前提とし、`vue` や `#app` からの明示的なインポートは行わない
- TypeScriptは `strict` が有効である。`any` や不要な型アサーションに頼らず、型を定義すること
- コメントは「なぜそうしているか」を説明するために書く。コードを読めばわかることは書かない

### スタイリング

- 設定はCSSファーストで行う。`app/assets/css/main.css` の `@import` と `@plugin` が入口であり、`tailwind.config.js` は作成しないこと
- daisyUIのコンポーネントクラス（`btn`、`card` など）を優先し、細かな調整をTailwindのユーティリティクラスで行う
- スコープ付きの `<style>` は、ユーティリティクラスで表現できない場合に限って使う

### アイコン

アイコンには [`@nuxt/icon`](https://nuxt.com/modules/icon) を使う。`<Icon name="..." />` に名前を渡すだけで描画され、生のSVGをコンポーネントへ書き下さない。

- 一般的なアイコンは Material Design Icons（`mdi:` プレフィックス、例: `mdi:cog`）を使う。アイコン名は [icones.js.org](https://icones.js.org/collection/mdi) で探せる
- このアプリ固有の図形（アプリロゴなど）は `app/assets/icons/` にSVGを置き、`custom:` プレフィックスで参照する（例: `custom:app-logo`）。コレクションの設定は `nuxt.config.ts` の `icon.customCollections` にある
- 描画モードは `app/app.config.ts` で `svg` に固定してある。既定の `css`（背景画像）ではテストで `<svg>` を検査できず、daisyUIのドックのように `currentColor` へ色を委ねる箇所とも相性が悪いため
- アイコン名を動的に組み立てる（テンプレートリテラルなど）と、`nuxt.config.ts` の `icon.clientBundle`（テスト実行時のみ有効）が静的スキャンで拾えない。`mainNavItems`（`app/utils/navigation.ts`）のようにコンポーネント外の配列からアイコン名を渡す場合は、その配列を `nuxt.config.ts` 側でも読み、`clientBundle.icons` へ明示的に列挙すること

### コード品質

以下のツールでコード品質を担保している。全てのコーディングはそれらのルールに従うこと。

- ESLint: `eslint.config.mjs` + `@nuxt/eslint` が生成する `.nuxt/eslint.config.mjs`
- Prettier: `.prettierrc.json`
- EditorConfig: `.editorconfig`

変更をコミットする前に、次を実行して全て通ることを確認すること。

```bash
npm run lint
npm run format
```

指摘があれば `npm run lint:fix` と `npm run format:fix` で修正し、再度上記を実行すること。

型チェック専用のスクリプトは用意していない。型エラーは開発サーバーやエディタ、`npm run build` で確認すること。

### テスト

Vitestでテストを書く。実行方法は `README.md` に記載している。

テストは2つのプロジェクトに分かれており、設定は `vitest.config.ts` にまとめてある。書く対象に応じて置き場所を選ぶこと。

- `unit`: 素のNode環境。純粋なロジックと、Nitroのサーバールートをh3のハンドラーとして直接叩く機能テストを置く
- `nuxt`: Nuxtのランタイムを立ち上げる環境。コンポーネントやページの描画・操作を確かめるUIテストを置く。起動が重いため、Nuxtのランタイムを要さないものは `unit` に置くこと

ファイル名は `*.spec.ts` とし、テスト対象と同じ階層構造で並べること。ディレクトリ名は変えないこと。Nuxtが生成する `tsconfig.app.json` は `tests/nuxt/**/*` を含むため、この名前であればエディタでNuxtの型と自動インポートが解決される。

方針は次のとおり。

- テスト名は日本語で、何が保証されているかを書く。「正しく動く」ではなく「未認証ならルックアップページへ送る」のように、期待する挙動そのものを書くこと
- 外部APIへは決して実通信しないこと。`tests/setup/nitro-auto-imports.ts` が `$fetch` を既定で失敗させてあるので、テストごとに `vi.stubGlobal` で差し替える
- サーバールートは `tests/helpers/h3.ts` の `callHandler` でWeb標準のリクエストとして叩く。`readBody` の解釈や `createError` の応答への変換まで含めて確かめるため、ハンドラーを関数として直接呼ばないこと
- 認証やリダイレクトの制限は、緩めた場合にテストが落ちる形で書くこと。オープンリダイレクトの防止やセッションへの保存内容は、壊れても画面上は正常に見えてしまう
- `tests/unit/repository/` にはリポジトリの規約そのものを守るテストを置いている。保護ページの宣言漏れやガイドのシンボリックリンクなど、レビューで見落とすと影響の大きいものが対象である
- 表示文言はテストにベタ書きせず、`tests/helpers/i18n.ts` の `jaMessage()` でキーから引くこと。ベタ書きすると翻訳ファイルとの二重管理になり、キーの綴り間違いも検出できない。文面の改訂では落ちず、キーの取り違えでは落ちる状態に保つ
- `nuxt` プロジェクトのブラウザの言語は `tests/setup/browser-locale.ts` で日本語に固定してある。happy-dom の既定は英語で、言語検出が働くとどちらの言語で描画されるかがテストごとに変わるためである。英語での描画は `setLocale('en')` で明示的に切り替えて確かめること
- `setLocale()` はそれ自体がそのロケールのURLへの遷移を起こす。`navigateTo` をモックしていない場合、接頭辞のないルートからロケールを判定し直して元に戻る。ロケールを切り替えるテストでは `navigateTo` をモックし、`setLocale` のあとに `flushPromises()` を挟んでから記録を消すこと

`server/` のコードはNitroの自動インポートに依存しており、素のNode環境では未定義になる。テストのためにソースへインポート文を足すのではなく、`tests/setup/nitro-auto-imports.ts` に名前を足して解決すること。

変更をコミットする前に、次を実行して通ることを確認すること。

```bash
npm run test
```

### CI

GitHub Actionsで次のワークフローを運用している。

- `.github/workflows/ci.yml`: `main` ブランチへのpushと全てのPRで、ESLintとPrettierのチェックとVitestのテストを実行する
- `.github/workflows/claude.yml`: Issue・PRのコメントやレビュー、Issueの本文・タイトルで `@claude` に言及した際にClaude Codeを実行する
- `.github/workflows/claude-code-review.yml`: ドラフトでないPRに対してコードレビューを実行する

エージェントが作成したPRはCIの結果を確認し、失敗していれば原因を調べて修正すること。CIが落ちた状態で放置しないこと。
