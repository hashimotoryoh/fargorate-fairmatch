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

MITライセンスで公開している。`LICENSE` はライセンスの定型文であり、英語の原文をそのまま置くこと。ライセンスを変更する場合は `LICENSE` と `package.json` の `license` の2か所を揃えること。フッターのLegal欄は「ライセンス」というラベル（`footer.license`）で `LICENSE` へリンクするだけで、ライセンス名は持たない。

## アプリケーション概要

アプリの名称は `FargoRate FairRace` である。必ずこの綴りで統一し、UI・翻訳・ドキュメントで別の表記を作らないこと。

メタタグに出るサイト名は `nuxt.config.ts` の `app.head.templateParams` に一本化してある（後述の「SEOのメタタグ」を参照）。名称を変える場合はまずここを直し、そのうえでヘッダーやトップの見出し、法務文書、JSON-LD、OGP画像など、文中や画像に直接入っている箇所を揃えること。

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
- `docs/fargorate-races-api.md`: FargoRateのレース（公平なセット数）の算出。使うのはフェアセットマッチ（`fair-single-race`）だけである
- `docs/csi-membership-lookup-api.md`: CSIのメンバーシップ検索（**現在は未使用**。FargoRate IDが必ずしもCSIに登録されていないことが判明したため使用をやめた。調査の記録として残している）

`docs/` に出てくる `fairmatch.fargorate.com` と `Find a Fair Match` はFargoRate公式のドメインと機能の名前であり、このアプリの名称とは無関係である。アプリ名の変更に巻き込んで書き換えないこと。

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
- Nuxt Image v2

パッケージマネージャーはnpmを使用する。`package-lock.json` を管理しているため、yarnやpnpmに置き換えないこと。依存を追加した場合は `package.json` と `package-lock.json` の両方をコミットすること。

## セットアップ

Node.js のバージョンは `.node-version` に従うこと。

セットアップ方法は人間にも案内する必要があるため `README.md` に記載している。そちらを参照すること。

エージェントは作業を始める前に `npm install` を済ませておくこと。`postinstall` で `nuxt prepare` が走り、型定義やESLint設定を含む `.nuxt` が生成される。これがない状態ではESLintも型解決も正しく動作しない。`.nuxt` が失われている場合は `npx nuxt prepare` で再生成できる。

## ディレクトリ構成

- `app/`: アプリケーションのソース。Nuxt v4 の `srcDir`
  - `app/app.vue`: ルートコンポーネント
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
  - `server/plugins/`: Nitroのプラグイン。起動時に自動登録される。`llms:generate` など、Nitroのフックに割り込む処理を置く
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

サーバールートは機能単位で立て、複数の機能で1つのルートを共用しないこと。共有するのは `server/utils/` の関数であって、ルートではない。ルートの責務は次の2つに絞る。

- どのゲートを通すか（`requireUserSession()` か、reCAPTCHAか。reCAPTCHAならどのアクション名か）
- その画面に必要な形へ応答を整えること

機能ごとにゲートの強さも応答の形も違うため、共用すると片方の都合で緩めた設定がもう片方へ漏れる。ルート自体は十数行の薄いものになるので、分けても重複はほとんど生じない。`POST /api/auth/guest` を `POST /api/auth/session` から分けてあるのも同じ判断による。

`app/` と `server/` の双方から使う型やユーティリティは `shared/` に置き、`#shared/` エイリアスで参照する。

### 認証

認証には2つの経路がある。セッション管理には [Nuxt Auth Utils](https://github.com/atinux/nuxt-auth-utils) を使う。

- FargoRateとのリンク（名前とFargoRate IDでプレイヤー情報を紐づける）
- ゲスト（IDを持たないユーザーの自己申告）

前者の入口は `/link` である。独自のIDもパスワードも持たず、名前とFargoRate IDを知っていれば誰にでもなれるため、本人性を検証する仕組みではない。実態は「このブラウザのセッションを、FargoRateの公開プロフィールへ紐づける」ことなので、その操作を指す `link` を名前に採っている。UIの見出しも「FargoRateとリンクする」「Link your FargoRate」で揃える。ここに本人確認や認証の強さを匂わせる語を持ち込まないこと。

このため、UI・翻訳・ドキュメント・テスト名で「サインイン」「Sign in」という語は使わない。セッションを始める操作は「リンク」または「利用を開始する」と書く。ただしセッションを終える操作は「サインアウト」「Sign out」のままにしてある（Nuxt Auth Utils 内蔵の `DELETE /api/_auth/session` に対応する操作であり、破棄することに曖昧さが無いため）。

いっぽう、外部APIへの問い合わせそのものは「検索」であり、`server/utils/lookup.ts` の `lookupPlayerProfile`・`server/api/*/lookup.post.ts`・`docs/*-lookup-api.md` は名前と実態が合っているため `lookup` のまま残してある。機能の名前（`link`）と操作の名前（`lookup`）を混ぜないこと。

リンクの導線での検索もプレイヤー検索（`/lookup`）も、FargoRate のAPIを名前で引く一段だけである。かつてはリンクの導線だけ「CSIをIDで引いて姓名を得て、その姓名でFargoRateを引く」二段だったが、FargoRate IDが必ずしもCSIに登録されていないことが判明したため、CSIは使わない。段数を増やす作りに戻さないこと。

「FargoRate ID」はユーザーに見せるための表記であり、内部の変数・プロパティはFargoRateのAPIのレスポンスに合わせて `membershipId` で統一する。`fargorateId` という名前を新たに作らないこと。また、FargoRate IDはかつて13桁の固定長と考えていたが、桁数が一定しないことが判明した。検証は `shared/utils/membershipId.ts` の `isValidMembershipId`（数字だけで構成されていることのみを確かめる）に一本化してあり、桁数を前提にした検証や文言を持ち込まないこと。

このルックアップ層は認証の一部ではなく、認証から使われている共有部品である。他プレイヤーのレーティングを閲覧するような、セッションと無関係の用途からも同じ層を呼べる状態に保つこと。具体的には次を守る。

- `server/utils/lookup.ts` と `POST /api/link/lookup` に、セッションの読み書きや「本人かどうか」の判断を持ち込まない。それらは `POST /api/auth/session` の責務である
- ルートは機能ごとに分ける。根拠はゲートと応答の形の違いであって、reCAPTCHAではない。リンクの導線は名前で検索した候補をメンバーシップIDの一致で1件に絞る確認のための経路、プレイヤー検索は名前で複数件を返す一覧の経路であり、返すものが違う
- reCAPTCHAのアクション名も機能ごとに分け、サーバールート側に直書きする（`link` と `playerLookup`）。管理コンソールでスコアの分布を機能ごとに見分け、しきい値を個別に調整できるようにするためである
- ただし**アクション名はアクセス制御ではない**。サイトキーは公開値であり、アクションを決めるのはクライアントなので、攻撃者は目的のアクションのトークンを自分で発行できる。アクション名で総当たりを止められると考えないこと。直書きにしているのは、クライアント制御の入力をルートの契約から減らすためと、分析の値を素直に保つためである
- 逆に、リンクの導線でしか使わないものへ `lookup` と名付けないこと。自分のFargoRate IDの調べ方を案内するモーダルは、他人を検索する機能と紛れないよう `FargoRateIdGuideModal`（座標は `app/utils/fargorateIdGuide.ts`、文言は `fargorateIdGuide.*`）としてある

#### FargoRateとのリンクによる認証

フローは次のとおり。

1. ユーザーが `/link` で名前とFargoRate IDを入力する
2. その名前でFargoRateメンバーシップルックアップAPIを検索し、同姓同名を含む候補の一覧を得る
3. 候補からメンバーシップIDの一致で1件に絞り、名前・所在地・レーティング・信頼度を得る
4. 得られたプレイヤー情報をユーザーに見せ、本人かどうかを確認する
5. 本人だと確認できたらセッションに保存する

FargoRateのAPIはメンバーシップIDでの検索を受け付けない（IDで引けるのは `readableId` だけで、ユーザーがそれを事前に知る術は無い）。名前での検索が唯一の経路であり、名前を入力させるのはそのためであって、本人確認のためではない。

確認の確定時（`POST /api/auth/session`）にクライアントから受け取る名前とメンバーシップIDは検索の鍵としてだけ使い、セッションに保存する情報はサーバー側でルックアップし直した結果を使う。実在のプレイヤーとメンバーシップIDが一致しない限りセッションは作られないため、クライアントが任意の名前やレーティングを自称することはできない。この方針を崩さないこと。

#### ゲスト認証

FargoRate IDを持たないユーザーは `/guest` で名前とレーティングを入力して利用を開始する。名前は任意で、未入力なら `null` を保存し、表示時に `player.guestName` で補う。既定名は言語によって変わるため、翻訳した文字列をセッションへ焼き込まないこと。

レーティングの範囲は `shared/utils/rating.ts` の `RATING_MIN` と `RATING_MAX`（-90 〜 930）に一本化してある。USAPLが公開しているハンディキャップ計算ツール（https://usaplraceto.azurewebsites.net/）が受け付ける入力レンジに合わせたものである。ゲスト固有の制限ではなく、レースAPIへ渡すレーティングの検証（`isValidRating`）も同じ定数を使う。ゲストの入力は `shared/utils/guestPlayer.ts` の `isValidGuestRating`（整数であることを足したもの）で検証し、条件を二重に書かないこと。

ゲストは `POST /api/auth/guest` という別のルートに分けてある。`auth/session` に相乗りさせると、検索の鍵を送るだけのつもりの経路に自称の値が紛れ込む余地が生まれるためである。ハンドラーはボディを展開せず、`readGuestPlayer()` が読み取った項目だけでオブジェクトを組み立てる。`membershipId` や `kind: 'fargorate'` を送られても効かないのはこのためで、`tests/unit/server/api/auth/guest.post.spec.ts` がそれを固定している。

このルートにもreCAPTCHAを付けている（アクションは `guest`）。外部APIは一切呼ばないが、未認証で誰でも叩けてセッションを無制限に発行できるためである。そのセッションは `POST /api/players/lookup` のreCAPTCHAを免れる鍵にもなるので、ここを素通しにすると外部APIへの総当たりの入口が開く。

#### プレイヤーの型

`shared/types/player.ts` に4つ置いてある。

- `Player`: 名前とレーティングだけを持つ土台。ゲームの処理はこの型にだけ依存させ、認証の種別を意識せずに済むようにする
- `SessionPlayer`: セッションに入りうるプレイヤー。`#auth-utils` の `User` はこれを継承する
- `FargoRatePlayer`: FargoRateで確認が取れたプレイヤー
- `GuestPlayer`: 自己申告だけのゲスト

`FargoRatePlayer | GuestPlayer` のユニオンで表せると素直だが、`User` はインターフェースであり、インターフェースはユニオン型を継承できない。そのため両者の上位型として `SessionPlayer` を挟んである。

どちらであるかの判別には必ず `isFargoRatePlayer()`（`shared/utils/player.ts`）を使い、`robustness` や `membershipId` の有無を見る形にしないこと。ゲストの自己申告値を、FargoRateで確認が取れた値と取り違えないためである。`GuestPlayer` がFargoRate固有の項目を型として持たないのも同じ理由による。

**reCAPTCHAを付けるかどうかは「外部APIを呼ぶか」ではなく「ボットに攻撃されうるか」で決める。** 未認証で誰でも叩けるルートは、外部APIを呼ばなくても対象になる。判定は `server/utils/recaptcha.ts` の `verifyRecaptchaToken`、クライアント側のトークン取得は `app/composables/useRecaptcha.ts` が担う。

現状の対象は次のとおり。

| ルート                     | アクション     | 付ける／付けない理由                                                   |
| -------------------------- | -------------- | ---------------------------------------------------------------------- |
| `POST /api/link/lookup`    | `link`         | 未認証で叩け、非公式の外部APIへ総当たりできる                          |
| `POST /api/players/lookup` | `playerLookup` | 同上。ただしセッションがあるときは免除する（後述）                     |
| `POST /api/auth/guest`     | `guest`        | 外部APIは呼ばないが、未認証で叩けてセッションを無制限に発行できる      |
| `POST /api/auth/session`   | なし           | `POST /api/link/lookup` を通過した画面遷移でしか呼ばれない             |
| `POST /api/auth/refresh`   | なし           | セッション必須。ボディを読まず、引き直す対象もセッションの本人だけ     |
| `GET /api/races`           | なし           | セッション必須。認証ページからしか呼ばれず、キャッシュが重複を吸収する |

`POST /api/players/lookup` はセッションがあるときreCAPTCHAを省く。セッションを持つ利用者は `/link` か `/guest` のどちらかで一度reCAPTCHAを通っており、二重に課すと画面を開くたびにスクリプトを読み込ませることになるためである。この免除が成立するのは**セッションを作る経路の両方にreCAPTCHAが付いている**ことが前提なので、`POST /api/auth/guest` から外さないこと。

開発環境（`NODE_ENV=development`、つまり `npm run dev`）ではreCAPTCHAを使わない。`verifyRecaptchaToken` は検証ごと省いて素通しし、クライアント側の `useRecaptcha` もスクリプトを読み込まずダミーのトークンを返すため、キーが未設定でも動く。v3にはテスト用キーが無いためである。Googleが公開しているテストキー（`6LeIxAcT...`）はv2用であり、このアプリでは使えない。v2の `siteverify` の応答には `score` も `action` も含まれず、スコア判定で必ず落ちるためである。reCAPTCHAそのものの動作をローカルで確かめる場合は、`localhost` をドメインに加えた自分のv3キーを設定し、本番ビルドで起動すること。素通しは `NODE_ENV` が `development` のときに限り、検証が通らないことを理由に `score` や `action` のチェックを緩めてはならない。

開発環境だけ挙動を変える分岐の書き方は2種類あり、使い分ける。実行時のコード（`server/`・`app/`）では `process.env.NODE_ENV === 'development'` で判定する。Nuxtの慣用である `import.meta.dev` はビルド時に静的展開される定数で、テストから `vi.stubEnv()` で切り替えられないためである。いっぽう `nuxt.config.ts` の設定値は `$development` の上書きで変える。実機確認（`npm run dev:host`）が平文HTTPになるためにセッションクッキーの `secure` を開発環境だけ外しているのがその例で、この上書きが `$development` に閉じていることは `tests/unit/repository/session-cookie.spec.ts` が検査する。

認証なしでアクセスできるのは `/`、`/link`、`/guest`、`/lookup`、`/blog`、`/blog/[スラッグ]`、`/faq`、`/privacy-policy`、`/terms-conditions` で、これは検索エンジンに開放するページと一致する。保護は名前付きミドルウェアで行う。

- `app/middleware/auth.ts`: 未認証なら `/link` へ送る。保護対象のページに `definePageMeta({ middleware: 'auth' })` で付ける
- `app/middleware/guest.ts`: 認証済みなら `/dashboard` へ送る。認証の入口である `/link` と `/guest` に付ける。名前が同じだが、これは「未認証のユーザー」の意味であり、ゲスト認証とは別の概念である

保護対象のパスをどこかに配列で列挙する形にはしないこと。グローバルミドルウェアであれ `routeRules` であれ、ページを追加するたびに更新が必要になり、更新漏れがそのまま情報の露出になる。保護に関わる指定はすべてページ側の `definePageMeta` から辿れる状態に保つこと。

`auth.ts` はSSR時に `x-robots-tag: noindex, nofollow` も立てる。レイアウトの `noindex` メタタグは本文を返す応答にしか乗らず、未認証時のリダイレクトをカバーできないため。

`auth.ts` は元の行き先を `redirect` クエリに残し、認証後にそこへ戻す。この値はURLから誰でも与えられるため、必ず `resolveRedirectPath()`（`app/utils/navigation.ts`）を通してから `navigateTo` に渡すこと。外部サイトへ誘導するオープンリダイレクトを防ぐため。`/link` と `/guest` は互いへのリンクでもこのクエリを引き継ぐ。片方で行き先を落とすと、経路によって戻り先が変わってしまう。

保護ページには `prerender` や ISR・SWR のルートルールを付けないこと。Nuxt Auth Utils はプリレンダやキャッシュの際にサーバー側のセッション取得を飛ばすため、ミドルウェアが認証済みのユーザーを未認証と判定してしまう。

サインアウトはNuxt Auth Utils内蔵の `DELETE /api/_auth/session` を使う。

セッションの秘密鍵は環境変数 `NUXT_SESSION_PASSWORD` で与える。`.env.example` を参照すること。

### プレイヤーのルックアップ

`/lookup` はFargoRateのプレイヤーを名前で検索し、レーティングと信頼度を見るページである。対戦相手の実力の目安を知るためのもので、認証を要さない公開ページとして置いてある。セッションには一切触れない。

- 検索は `POST /api/players/lookup`。reCAPTCHAのアクションは `playerLookup` で、未認証のときだけ通す（認証済みは免除。前述の「reCAPTCHA」を参照）
- 検索の実体は `server/utils/lookup.ts` の `searchPlayers` で、リンクの導線と同じFargoRateのAPIを引く。違いは絞り込みで、リンクの導線（`lookupPlayerProfile`）がメンバーシップIDの一致で1件に絞るのに対し、こちらは絞らずヒットした全件を `FargoRateSearchResult`（名前・ID・所在地・レーティング・信頼度）で返す
- 検索語はそのまま `q` に渡す。このAPIは姓名のほかレスポンスの `readableId` でも引けるため、入力を名前に限定する検証を入れないこと。`readableId` は表示用のIDで、リンクに使うFargoRate ID（`membershipId`）とは別物である。両者を取り違えないこと
- 結果の一覧は `card` で見せ、レーティングと信頼度は `stat` に置く。所在地は名前の下に小さく添える
- 該当が無いことは異常ではないため、404ではなく空配列を返す
- 読み取れない行が混じっても一覧全体は落とさず、行単位で除く。1件の異常で他の正常な結果まで見せられなくなるのを避けるため
- 入力の長さの条件は `shared/utils/playerQuery.ts` の `PLAYER_QUERY_MIN_LENGTH`・`PLAYER_QUERY_MAX_LENGTH` に一本化してある。フォームとサーバールートの双方で `isValidPlayerQuery()` を使い、条件を二重に書かないこと

導線はヘッダー右のアイコンボタン（`heroicons:users`。名称はツールチップと読み上げ用ラベルで補う）と、フッターのブランドエリア（`footerStartNavItems`）に置いてある。ブログと同じく、主要ナビゲーションの `mainNavItems` には足さない方針である。両方から外すと辿り着けなくなるので注意すること。なお、同じブランドエリアの利用開始の導線（`/link`・`/guest`）は `guestOnly` の印で未認証のときだけ出す。認証済みが開いても `guest` ミドルウェアで `/dashboard` へ戻されるだけのデッドリンクになるためで、認証の有無によらず機能するプレイヤー検索とは扱いが異なる。

### ゲーム

ゲームは `/games` 配下に置く。ルールも勝敗のつきかたもスコアボードの見た目もゲームごとに完全に異なるため、それぞれ独立したモジュールとして実装する。ルーティングの規則は次の一行に集約される。

**ゲームが未確定の画面は `/games/briefing`、確定した後の画面は `/games/<スラッグ>/` に置く。**

- `/games`: 入口。ゲーム一覧と最近の対戦相手
- `/games/briefing`: ステップ1（ゲームを選択）とステップ2（対戦プレイヤーを選択）。並びは常に固定で、先に決まっていたステップに完了印を付ける。ゲームは `?game=<スラッグ>` のクエリで渡してよいが、読み取ったら状態へ移してURLから落とす。対戦相手はクエリで渡さない（FargoRateのAPIはメンバーシップIDでは検索できず、他人のIDをURLに残さないため）
- `/games/<スラッグ>/briefing`: ステップ3（ゲーム固有の設定と確認）
- `/games/<スラッグ>/scoreboard`: スコアボード。ゲーム間で共有しない

ゲームを追加する作業は、`app/utils/games.ts` の `gameDefinitions` に1件足し、`app/pages/games/<スラッグ>/` にブリーフィングとスコアボードの2ページを置くことに収まる。スラッグからコンポーネントを引く対応表は作らないこと。

状態は `useState` + `sessionStorage` で持つ（Piniaは導入しない）。`useGameSetup`（選んだゲームと対戦相手）が全ゲーム共通、`useFairSingleRace`（セット数と得点の履歴）がフェアセットマッチ固有である。対戦相手の型は `FargoRatePlayer | GuestPlayer` のユニオンでよい。セッションに入らないため `SessionPlayer` の制約を受けない。

対戦プレイヤーの選択（`OpponentSelector`）は名前検索・最近の対戦プレイヤー・ゲスト入力の3経路である。ID入力は置かないこと。FargoRateのAPIがIDでの検索を受け付けない以上、成立しない。検索は `/lookup` と同じ `usePlayerSearch` + `POST /api/players/lookup` を使い、`membershipId` が無い候補は選べなくする。最近の対戦プレイヤー（`useRecentOpponents`、直近20件）はプレイヤーを丸ごとlocalStorageに保存し、個別削除は `/games` にのみ置く。

入口と離脱の規則は次のとおり。

- **入口では選択を丸ごと作り直す**（`startWithGame` / `startWithOpponent`）。前回の残りが付いてくると、選んでいないステップが完了済みで始まってしまう。入る前のページを `returnTo` に覚える
- **ブリーフィングの中断（ヘッダー左「中断」）は全てを破棄**し、`returnTo` のページへ戻す
- **プレイの中断（スコアボードのヘッダー左「中断」）はスコアだけを捨て**、ゲーム設定へ戻す。ゲームと対戦プレイヤーと設定は残る
- **プレイの完了（結果ダイアログの「終了」）は全てを破棄**し、`returnTo` のページへ戻す

プレイヤーの `card` 表示は `PlayerCard`（名前を大きく中央、下に所在地、下にレーティングと信頼度の `stat`）に一本化してあり、ダッシュボード・リンクの本人確認・プレイヤー検索・ゲームの各画面で共用する。最近の対戦プレイヤーの一覧だけは、見比べる用途に合わせて横に詰めた `RecentOpponentCard` を使う。

ゲーム設定（ステップ3）に入るたびに、両者のレーティングをFargoRateへ問い合わせて引き直す。自分は `POST /api/auth/refresh`（ボディを読まず、セッションの本人だけを引き直す）、相手は `POST /api/players/lookup` を使う。検索キーは `readableId ?? name` とし、**同一性の確認は必ず `membershipId` で行う**。`readableId` は欠けたり変わったりしない保証が無いため、検索キー以上の役割を持たせないこと。引き直しに失敗しても既存の値で続行し、ゲームの開始を止めないこと。対局中（スコアボード）では引き直さない。途中で必要セット数が変わってはならないため。

外部APIへの問い合わせはサーバー側でキャッシュしている。`fetchFargoRateLookup` が6時間、`fetchRaces` が24時間で、どちらも `defineCachedFunction` で関数側に掛けてある。**`defineCachedEventHandler` でハンドラーごとキャッシュしないこと。** キャッシュヒット時に `requireUserSession` やreCAPTCHAの検査が実行されず、関門が素通りになる。

スコアボードは横向き前提で、`useLandscapeLock` が全画面と向きのロックを試み（Android向け。ユーザー操作を起点にしか呼べない）、縦向きの間は `RotateDevicePrompt` で回転を促す（iOS Safariはロック非対応）。得点は履歴の配列で持ち、スコアはその集計として導く。取り消しは「そのプレイヤーの最後の1点を取り除く」操作であり、スコアの遷移の表示と食い違わない。対局中は `useWakeLock` で画面消灯を防ぐ。

`/settings` の「端末に保存したデータ」の削除が消すのは、最近の対戦相手・最近使用したアカウント・進行中のゲームなど端末ローカルのデータだけである。サーバー側のAPIキャッシュは全ユーザー共有のため、個人の設定からは触らない。

### レイアウト

レイアウトは3つある。`default` と `authenticated` はヘッダー・フッター・FABが共通で、`AppHeader`・`AppFooter`・`AppFab` を両者から使う。

- `default`: 公開ページ（`/`、`/link`、`/guest`、`/lookup`、`/blog`、`/faq`、`/privacy-policy`、`/terms-conditions`）用
- `authenticated`: 認証ページ（`/dashboard`、`/games`、`/settings`）用
- `game`: ゲーム進行ページ（`/games/briefing` と `/games/<スラッグ>/` 配下）用。対局に集中させるため共通のヘッダー・フッター・FABを出さず、各ページが `GameHeader` を置く。中央の見出しはページから渡す（ブリーフィングは「ゲームを開始する」、スコアボードはゲーム名）でリンクにしない。左は `GameExitButton`、右はページごとのスロット

`authenticated` と `game` には `noindex` をまとめて指定してある。保護ページとこれらのレイアウトが対応するため、ページごとに書くより追加漏れが起きない。保護ページを追加する際は `definePageMeta({ middleware: 'auth', layout: 'authenticated' })`（ゲーム進行ページは `layout: 'game'`）を付けること。`tests/unit/repository/page-protection.spec.ts` が保護レイアウトの `noindex` 宣言ごと検査する。

主要ナビゲーションは認証済みなら `AppHeader` を使うどのページでも出す。デスクトップ幅ではヘッダー中央の `tabs tabs-border`、スマホ幅では `AppFab`（daisyUIの `fab fab-flower` スピードダイヤル。アイコン表示で名称はツールチップ）が同じ項目（`mainNavItems`）を担う。出し分けは `AppHeader`・`AppFab` それぞれの中で `useUserSession()` の `loggedIn` を見て行い、レイアウトからpropsで制御しない。`/` は認証済みでも紹介ページのままにする方針だが、ナビゲーションは出る。

### 多言語化

日本語（`ja`）と英語（`en`）に対応する。設定は `nuxt.config.ts` の `i18n` にまとめてある。

- URLの戦略は `prefix_except_default`。日本語は接頭辞なし、英語は `/en` を頭に付ける
- 初回はブラウザの言語で振り分ける。振り分けるのはトップページに来たときだけとし、言語を指定したURLは尊重する。全ページで振り分けると、共有された `/en/privacy-policy` を日本語話者が開いたときに読めない側へ飛ばされる
- 言語を増やす作業は、`i18n.locales` に1項目足して `i18n/locales/<コード>.json` を置くだけで終わる状態に保つこと。`LocaleSwitcher` の選択肢（表示名 `name` と国旗 `flag`）は設定から作っており、言語名や国旗を書き並べた箇所を新たに作らないこと

文言は `i18n/locales/*.json` に置く。キーは画面やコンポーネント単位でネストし、テンプレートに現れる順に並べる。文言を足すときは必ず全ての言語に同じキーで足すこと。抜けは `fallbackLocale` に吸収されて別の言語の文面が混ざるだけなので、画面上は壊れて見えない。`tests/unit/repository/i18n.spec.ts` が過不足を検査する。

補間は名前付きのプレースホルダだけを使う。語順は言語で変わるため、「〜として〜しています」のような文は語の並びごと翻訳側に委ねること。

モジュールスコープの定数からは翻訳関数を呼べない。`app/utils/navigation.ts` のように定義時点で文言を決められない場所では、メッセージのキーを持ち、描画側で `$t()` に通すこと。

`useSeoMeta` に渡すページ固有のメタは、ロケールの切り替えに追随させるため値ではなくゲッター（`title: () => t('seo.index.title')`）で渡すこと。

リンクとリダイレクトの遷移先は `localePath()` に通し、ロケールを落とさないこと。対象は `NuxtLink` の `to`、ミドルウェアの `navigateTo`、認証後の復帰先である。`resolveRedirectPath()` はロケールを知らない純粋な関数のまま保ち、オープンリダイレクトの判定とロケールの付与を混ぜないこと。既にロケールを含むパスを `localePath()` に通しても二重には付かない。

`<title>` と `og:title` は「タイトル - FargoRate FairRace」で揃える。サイト名と区切りは `nuxt.config.ts` の `app.head.templateParams` に一本化してあり、`titleTemplate` と `app/app.vue` の `ogTitle` が同じ値を参照する。unhead の `templateParams` は `titleTemplate` だけでなく各メタの `content` でも展開されるため、この形が取れる。

ページ側で `ogTitle` を書かないこと。書くと接尾辞の管理が二重になり、ページを足すたびに書き忘れが起きる。`title` だけを与えれば `og:title` は自動で揃う。プレースホルダは `%pageTitle`（そのページの `title`）・`%separator`・`%siteName` で、`%pageTitle` が空のときは区切りごと落ちてサイト名だけが残る。`%s` は `titleTemplate` でしか展開されないため、メタには使えない。

`og:description` は `description` と同じ文言にする。OGPカードは長い説明を切り詰めるため、検索結果向けの説明と別に短い版を持つ意味が薄く、2本あると改訂のたびに片方だけ古くなる。翻訳のキーは `seo.<ページ>.description` の1つだけにし、ページ側では `description` と `ogDescription` の双方へ同じキーを渡すこと。

SEOのメタタグは `app/app.vue` の `useLocaleHead()` がまとめて作る。`html` の `lang`、hreflang の alternate と `x-default`、canonical、`og:url`、`og:locale` が対象で、これらを手書きで足さないこと。言語を増やすたびに漏れる。

公開URLは `NUXT_PUBLIC_SITE_URL` の1つだけを読み、i18n の `baseUrl`・`site.url`・`runtimeConfig` の全てへ渡す。環境変数を分けると片方だけ設定された状態が起き、誤ったドメインを指す canonical が出る。この形は `tests/unit/repository/site-url.spec.ts` で固定してある。

### robots.txt と sitemap

`robots.txt` は静的ファイルを置かず、`@nuxtjs/sitemap` と同じNuxt SEOファミリーの `@nuxtjs/robots` が動的に生成する。手書きの静的ファイルでは `NUXT_PUBLIC_SITE_URL` に依存する `Sitemap:` 行を環境ごとに正しく埋め込めないためである。

保護ページ（`/dashboard`、`/games` 配下、`/settings`）のパスは `nuxt.config.ts` の `PROTECTED_PAGE_PATHS` に一本化してあり、`sitemap.exclude` と `robots.disallow` の両方がこの1つだけを参照する。ロケール接頭辞付きのパス（`/en/...`）は `@nuxtjs/i18n` の設定から両モジュールが自動で展開するため、接頭辞なしのパスだけを挙げれば足りる。robots.txt の Disallow は前方一致だが sitemap の exclude はパスの一致で判定するため、exclude 側は `/games/**` のようなパターンを `flatMap` で足してある。配下のページは親のパスが列挙されていれば覆われるので、ゲームを増やすたびに更新は要らない。親を持たない保護ページを増やす際はこの配列を更新すること。`tests/unit/repository/page-protection.spec.ts` が `app/pages/` から導いた保護ページの一覧との整合性を検査する。

### Markdownで管理するドキュメント

文面が主体で、改訂がアプリの挙動と関係しないページは [Nuxt Content](https://content.nuxt.com/) で管理し、実体を `content/` のMarkdownに置く。文面の改訂をコードの変更と切り離すためである。文面だけを直す場合はMarkdownのみを変更し、Vueのコードには触れないこと。

現在あるのはプライバシーポリシー（`/privacy-policy`）と利用規約（`/terms-conditions`）だが、同じ仕組みで別のドキュメントも足せる。特定のドキュメントに寄った名前を付けないこと。

- `content/ja/privacy-policy.md` が `/privacy-policy` に、`content/en/privacy-policy.md` が `/en/privacy-policy` に対応する。`content/` の直下は言語のディレクトリで、その中のファイル名がそのままルートになる
- ドキュメントは全ての言語に同じ名前で置くこと。片方の言語にしか無いと、その言語で開いたときだけ404になる
- ページ（`app/pages/privacy-policy.vue` など）は `MarkdownDocument` にパスを渡すだけの薄いものに保つ
- フロントマターには `title`・`description`・`updatedAt` を書く。`title` は見出しとタイトルタグ、`description` はメタタグ、`updatedAt` は最終更新日の表示に使う
- 見出しは `##` から始める。ページの `h1` は `title` から出しているため、本文に `#` を書くと見出しが重なる
- 文面を改訂したら `updatedAt` も改めること。文面が言語をまたぐ内容であれば、全ての言語を揃えて改訂すること
- フッターに出す場合は `app/utils/navigation.ts` の `footerSupportNavItems`（Support欄）か `footerLegalNavItems`（Legal欄）に足す

ドキュメントを追加する際は、Markdownとページに加えて、公開ページであれば `tests/unit/repository/page-protection.spec.ts` の `PUBLIC_PAGES` も更新すること。

コレクションは言語ごとに分けてある（`content.config.ts` の `documents_ja` と `documents_en`）。Nuxt Content はコレクションをまたいだ絞り込みを持たないためである。`source` の `prefix` を空にしてパスから言語を外してあるので、ページが渡すパスは言語によらず `/privacy-policy` のままでよい。`type: 'page'` が備える `description` は本来任意項目だが、メタタグに必ず出すためスキーマで必須にしてある。用途の異なるコンテンツを足す場合は、言語のディレクトリの下にさらにディレクトリを切り、コレクションを分けること。

プライバシーポリシーと利用規約は準拠法が日本法であるため、日英どちらにも「解釈に相違がある場合は日本語版を優先する」条項を置いてある。法務文書の翻訳を足す場合も同じ扱いにすること。

データベースの接続には Node.js 同梱の `node:sqlite` を使う設定にしてある（`nuxt.config.ts` の `content.experimental.sqliteConnector`）。既定のままでは `better-sqlite3` のインストールを対話的に促され、CIのビルドが止まるため、この指定を外さないこと。

### ブログ

アップデートやプレスリリースなどのブログは `/blog`（一覧）と `/blog/[slug]`（詳細）で扱う。プライバシーポリシー等が1文書1ページなのに対し、ブログは複数記事を持つ点が異なるため、`documents_ja`/`documents_en` とは別に `blog_ja`/`blog_en` コレクションを `content.config.ts` に持つ（「用途の異なるコンテンツを足す場合は、言語のディレクトリの下にさらにディレクトリを切り、コレクションを分けること」の実例）。

- `content/ja/blog/<スラッグ>.md` が `/blog/<スラッグ>` に対応する。`source` の `include` は `<ロケール>/blog/**`、`prefix` は `'blog'` にしてあり、ロケールの部分だけを外して `blog/` を残す
- 記事は日英を1対1でペアリングする運用にしてある。`tests/unit/repository/blog.spec.ts` がスラッグの過不足を検査する
- フロントマターは `title`・`description`・`date`（公開日）が必須、`updatedAt`（改訂日）・`image`（記事固有のOGP画像。`public/` 起点のパス）は任意
- `/blog/[slug]` はこのリポジトリで最初の動的ルートであり、`app/pages/` にサブディレクトリを持つ最初のページでもある。`tests/unit/repository/page-protection.spec.ts` の `pageNames()` はこれに対応して `app/pages/` を再帰的に辿るようにしてあるため、ページを深い階層に追加しても保護の検査から漏れない
- 記事の取得・404処理・SEOは `MarkdownDocument` を流用せず `BlogArticle` コンポーネントに分けた。公開日・改訂日の扱いや `article` 用のOGP（後述）など性質が異なるため

`/blog/[slug]` は動的ルートで、ページのルート定義からはスラッグを列挙できない。`@nuxtjs/sitemap` にMarkdownの記事パスを教えるため、`server/api/__sitemap__/blog.ts` で `blog_ja` コレクションから全記事のパスを返し、`nuxt.config.ts` の `sitemap.sources` に登録してある。返す各URLに `_i18nTransform: true` を付けることで、通常のページと同じくロケール接頭辞付きのURL（`/en/blog/<スラッグ>`）とhreflangの相互参照を `@nuxtjs/sitemap` 側が自動で組み立てる（記事は日英を1対1でペアリングしているため、既定ロケールのコレクションだけを見れば全スラッグを網羅できる）。

記事詳細は `og:type: article` と `article:published_time`/`article:modified_time` を出し、`Article` 形式のJSON-LD（`application/ld+json`）も埋め込む。`BlogArticle` を触る場合、これらは他のページに無い固有の実装なので崩さないこと。schema.orgの `NewsArticle` はGoogle Newsへの掲載を前提とした型ではなく、一般的な記事を表す`Article`型を使っている（アップデート告知はニュース記事としての掲載要件を満たさないため）。

記事固有のOGP画像（`image`）が無ければ、`public/img/ogp.png` のサイト共通の既定OGP画像にフォールバックする。この既定画像は `app/app.vue` の `useSeoMeta` からも参照しており、ブログ以外の全ページのSNSシェア時のプレビューにも使われる。canonical等と同じく、`NUXT_PUBLIC_SITE_URL` が未設定の間は絶対URLを組めないため、OGP画像とJSON-LDのどちらも出さない。

一覧・詳細のいずれも、このOGP画像を本文の見出し画像としてそのまま表示する。`<img>` を直接書かず `@nuxt/image` の `<NuxtImg>` を使うこと。`public/` 直下のローカル画像はIPXプロバイダーが追加設定なしで最適化を扱える。

主要ナビゲーションの `mainNavItems`（ヘッダーのタブとFAB）にはブログを追加しない方針。認証の有無によらず辿れる導線として `app/utils/navigation.ts` の `footerSupportNavItems`（フッターのSupport欄）と、設定ページ（`/settings`）のカードにリンクを置いている。

### llms.txt

AIクローラー・エージェント向けに、サイト構造を案内する `/llms.txt`（[llmstxt.org](https://llmstxt.org/) の規約）を公開している。公式モジュール [`nuxt-llms`](https://github.com/nuxt-content/nuxt-llms) を `nuxt.config.ts` の `modules` に足すと、`@nuxt/content`（^3.2.0以降）がこれを自動検出してフック連携し、`llms` 設定に応じて `/llms.txt` を組み立てる。`nuxt-llms` は `@nuxt/content` より後に置くこと（検出のタイミングの都合）。

このアプリの i18n は `prefix_except_default` だが、`nuxt-llms` はロケールを意識せず単一の `/llms.txt` しか生成しない。ロケールごとに分けず、**英語だけの単一ファイル**として公開する方針にしてある（`robots.txt` も単一ファイルである前例に揃えた）。本文中のリンクも英語ロケールのURL（`/en/...`）を指す。この方針により、`llms.sections` には `documents_en`・`blog_en` だけを `contentCollection` で参照し、`documents_ja`・`blog_ja` は参照しない。日本語コレクションを足すと方針が崩れるため、`tests/unit/repository/llms-txt.spec.ts` で機械的に検査している。

`documents_ja`/`documents_en`、`blog_ja`/`blog_en` はそれぞれ日英で同じパス（`prefix` にロケールを含めない設計、前述）を共有するため、`@nuxt/content` が `sections` の `contentCollection` から自動生成する `/raw/*.md` リンクは、素朴には最初に見つかったコレクション（＝`documents_ja`・`blog_ja`）を返してしまい、英語のはずのリンクが日本語本文を返す。`llms.contentRawMarkdown.excludeCollections` に `documents_ja`・`blog_ja` を列挙し、日本語コレクションを `/raw/*.md` の対象から外すことでこれを防いでいる。コレクションを追加・変更する際はこの一致に注意すること。

`llms.sections` の `contentCollection` は `type: 'page'` を前提にしており（`path`/`title`/`seo`/`description` 列を選択する実装のため）、個別ページを持たない `type: 'data'` のコレクション（FAQなど）には使えない。FAQのセクションは `server/plugins/llms-faq.ts` が Nitro の `llms:generate` フックに割り込み、`faq_en` を読んで質問をtitle・回答をdescriptionとするリンクを動的に組み立てて足している。`nuxt.config.ts` にFAQの文面を書き写さないのは、`content/en/faq.csv` を唯一の情報源に保つため。このプラグインも日本語コレクション（`faq_ja`）を参照しない・保護ページを指さない方針は他のセクションと同じで、`tests/unit/repository/llms-txt.spec.ts` で検査している。

### スクリーンショットを使った案内

`public/img/fargorate-id-*.png` には本人以外の顔が写り込んでいる。`ScreenshotFigure` で必要な範囲だけを切り出して使い、**顔がDOMに存在しない範囲までクロップすること**。切り出し範囲を変更する際は必ず写り込みがないことを確認すること。

ぼかしで隠す方法は採らない。`backdrop-filter` は祖先の `opacity` の影響を受け、モーダルはまさに `opacity` を遷移させるため、環境によっては素通しになりうる。

FargoRateアプリの表示言語は端末の設定に従うため、案内の画像も本来は言語ごとに撮り分ける必要がある。画像とクロップの座標は文言ではないので翻訳ファイルではなく `app/utils/fargorateIdGuide.ts` に置き、ロケールで引く形にしてある。**英語版の画像はまだ用意できておらず、当面は日本語版を流用している。** 英語のスクリーンショットが揃ったら `en` の配列だけを差し替えること。

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

- 一般的なアイコンは Heroicons（`heroicons:` プレフィックス、例: `heroicons:cog`）を優先し、Heroiconsに無い図形（`mdi:billiards-rack` など）は Material Design Icons（`mdi:`）で補う。ブランドのアイコンは Font Awesome Brands（`fa7-brands:` プレフィックス、例: `fa7-brands:github`）を使う。アイコン名は [icones.js.org](https://icones.js.org/) で探せる
- このアプリ固有の図形（アプリロゴなど）は `app/assets/icons/` にSVGを置き、`custom:` プレフィックスで参照する（例: `custom:app-logo`）。コレクションの設定は `nuxt.config.ts` の `icon.customCollections` にある
- 描画モードは `nuxt.config.ts` の `icon.mode` で `svg` に固定してある。既定の `css`（背景画像）では `currentColor` へ色を委ねたい箇所（daisyUIのボタンなど）と相性が悪いため
- `nuxt.config.ts` に `icon.clientBundle` や `icon.provider: 'none'` のようなテスト専用の分岐は加えないこと。`@nuxt/icon` のREADMEはVitest Browser ModeやCypress Component Testingのような、実サーバーを持たない環境向けにこの構成を案内しているが、Vitestの `nuxt` プロジェクトは `@nuxt/test-utils` が裏で実際にNitroを起動するため、アイコンはテスト中も本物のAPI経由で解決できる。動的に渡すアイコン名（`mainNavItems`の`icon`など）を検査する必要が生じても、まず本当に静的スキャンや事前バンドルが要るかを確かめてから足すこと

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

- テスト名は日本語で、何が保証されているかを書く。「正しく動く」ではなく「未認証ならリンクページへ送る」のように、期待する挙動そのものを書くこと
- 外部APIへは決して実通信しないこと。`tests/setup/nitro-auto-imports.ts` が `$fetch` を既定で失敗させてあるので、テストごとに `vi.stubGlobal` で差し替える
- サーバールートは `tests/helpers/h3.ts` の `callHandler` でWeb標準のリクエストとして叩く。`readBody` の解釈や `createError` の応答への変換まで含めて確かめるため、ハンドラーを関数として直接呼ばないこと
- 認証やリダイレクトの制限は、緩めた場合にテストが落ちる形で書くこと。オープンリダイレクトの防止やセッションへの保存内容は、壊れても画面上は正常に見えてしまう
- UIのテストはpropsや状態に応じて分岐する見た目（表示文言、href、状態を表すクラス、計算されたstyleなど）を確かめる。アイコンのSVGパスやライブラリの既定の`aria-hidden`のような、分岐なく描画されるだけの内容は、壊れようがないため検査しない
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
