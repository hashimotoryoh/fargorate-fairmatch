# FargoRate FairMatch

FargoRateを用いたビリヤード対戦を補助するウェブアプリ。対戦中のスコアの入力や、対戦成績の振り返りなどを補助する。

このアプリは、ユーザーのFargoRateを公式システムからAPI経由で取得して扱うが、対戦結果をそのシステムには送信せずレーティングの更新は行わない。

## 技術スタック

- [Nuxt v4](https://nuxt.com/)
- [Vue 3](https://ja.vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [daisyUI](https://daisyui.com/)
- [Nuxt Auth Utils](https://github.com/atinux/nuxt-auth-utils)
- [Nuxt Content](https://content.nuxt.com/)
- [Nuxt I18n](https://i18n.nuxtjs.org/)

## ページ

| ルート              | 用途                             | 認証 |
| ------------------- | -------------------------------- | ---- |
| `/`                 | アプリの紹介                     | 不要 |
| `/lookup`           | FargoRate IDでのサインイン       | 不要 |
| `/privacy-policy`   | プライバシーポリシー             | 不要 |
| `/terms-conditions` | 利用規約                         | 不要 |
| `/dashboard`        | 自分のレーティングなどの表示     | 必要 |
| `/game`             | 種目を選んで新しいゲームを始める | 必要 |
| `/settings`         | サインアウトなどの設定           | 必要 |

検索エンジンにインデックスさせるのは認証の要らないページのみで、これは認証なしでアクセスできるページと一致する。公開ページは言語ごとのURLを `sitemap.xml` に載せ、hreflang で互いを指し示す。

## 表示言語

日本語と英語に対応している。日本語のURLは接頭辞なし、英語は `/en` を頭に付けたURLになる（`/lookup` と `/en/lookup`）。

初めて開いたときはブラウザの言語設定で振り分ける。振り分けるのはトップページに来たときだけで、`/en/privacy-policy` のような言語を指定したURLは尊重する。ヘッダーと設定ページのセレクトボックスで切り替えられ、選んだ言語は `i18n_redirected` クッキーに残るため次回以降も維持される。

文言は `i18n/locales/` のJSONにある。文言を足すときは日本語と英語の両方に同じキーで書くこと。片方だけだと、抜けた側で別の言語の文面が混ざったまま表示される。

| ファイル               | 言語   |
| ---------------------- | ------ |
| `i18n/locales/ja.json` | 日本語 |
| `i18n/locales/en.json` | 英語   |

案内モーダルに使うFargoRateアプリのスクリーンショットは、まだ日本語表示のものしかない。英語で表示したときも同じ画像を使っているため、英語版の画像が用意でき次第 `app/utils/lookupGuide.ts` の `en` を差し替えること。

## Markdownで管理するドキュメント

文面が主体のページは Nuxt Content で管理しており、実体は `content/` のMarkdownである。文面だけを直したい場合はMarkdownを編集すればよく、Vueのコードには触れなくてよい。

| ファイル                         | ルート                 |
| -------------------------------- | ---------------------- |
| `content/ja/privacy-policy.md`   | `/privacy-policy`      |
| `content/ja/terms-conditions.md` | `/terms-conditions`    |
| `content/en/privacy-policy.md`   | `/en/privacy-policy`   |
| `content/en/terms-conditions.md` | `/en/terms-conditions` |

`content/` の直下は言語のディレクトリで、その中のファイル名がそのままルートになる。同じ仕組みで別のドキュメントも足せるが、全ての言語に同じ名前で置くこと。片方の言語にしか無いと、その言語で開いたときだけ404になる。

フロントマターには `title`・`description`・`updatedAt` を書く。`title` はページの見出しとタイトルタグに、`description` はメタタグに、`updatedAt` は最終更新日の表示に使う。本文の見出しは `##` から始め、`#` は使わない。

プライバシーポリシーと利用規約は準拠法が日本法であるため、日英どちらにも「解釈に相違がある場合は日本語版を優先する」条項を置いている。

Nuxt Content はビルド時にMarkdownをSQLiteのデータベースへ書き出す。データベースの接続には Node.js 同梱の `node:sqlite` を使う設定にしてあるため、`better-sqlite3` などのネイティブモジュールを別途入れる必要はない。

## 認証

ユーザーはFargoRate ID（13桁の数値）のルックアップを通して認証される。入力されたIDでCSIメンバーシップルックアップAPIから姓名を引き、その姓名でFargoRateメンバーシップルックアップAPIを検索してレーティングを得る。表示されたプレイヤーが本人であることをユーザーが確認するとサインインが完了する。

未認証のユーザーが認証の必要なページを開くと `/lookup` へ送られ、サインインを終えると元のページへ戻る。パスワードの登録はない。

## セットアップ

Node.js のバージョンは `nodenv` によって `.node-version` で固定されている。

```bash
npm install
```

環境変数を `.env.example` からコピーして用意する。

```bash
cp .env.example .env
```

`NUXT_SESSION_PASSWORD` はセッションクッキーの署名・暗号化に使う32文字以上の秘密鍵で、空のままでも開発サーバーの初回起動時に自動生成される。本番環境では明示的に設定すること。

`NUXT_PUBLIC_SITE_URL` は公開URLのオリジンで、OGPやcanonical、hreflang、sitemap の絶対URLの組み立てに使う。開発中は空のままでよい。空の場合はそれらのメタタグとsitemapを出力しない。

この値はコミットハッシュと同じくビルド時に解決する。実行時に渡しても反映されないため、ビルドを行う環境で設定すること。

`NUXT_PUBLIC_RECAPTCHA_SITE_KEY` と `NUXT_RECAPTCHA_SECRET_KEY` は `/lookup` のBot対策に使う reCAPTCHA v3 のキー。[reCAPTCHA admin console](https://www.google.com/recaptcha/admin) でv3のサイトを登録して取得する。ドメインに `localhost` を加えておけば、ローカル開発でも同じキーで動作を確認できる。

Googleが公開しているテストキー（`6LeIxAcT...`）はv2用なので使わないこと。v2の `siteverify` の応答にはv3の `score` が含まれず、スコア判定で必ず失敗する。v3用のテストキーは公開されていない。

フッターに表示するコミットハッシュはビルド時に解決する。ホスティングが渡す環境変数（`VERCEL_GIT_COMMIT_SHA` や `GITHUB_SHA` など）があればそれを使い、無ければローカルの `git rev-parse` にフォールバックする。どちらも得られない場合はバージョン表示自体を省く。

## 開発サーバー

`http://localhost:3000` で開発サーバーが起動する。（ポートが使用されている場合はインクリメントされる。）

```bash
npm run dev
```

## 本番ビルド

```bash
npm run build

# 本番ビルドのローカルでのプレビュー
npm run preview
```

## コード品質

```bash
# ESLint
npm run lint
npm run lint:fix
# Prettier
npm run format
npm run format:fix
```

型チェック専用のスクリプトは用意していない。型エラーは開発サーバーやエディタ、`npm run build` で確認する。

## テスト

[Vitest](https://vitest.dev/) でテストを実行する。

```bash
# 全て実行する
npm run test

# 変更を監視して実行し続ける
npm run test:watch

# カバレッジを測る
npm run test:coverage
```

テストは2つのプロジェクトに分かれている。片方だけを実行したい場合は `--project` で選ぶ。

| プロジェクト | 置き場所      | 実行環境         | 対象                                       |
| ------------ | ------------- | ---------------- | ------------------------------------------ |
| `unit`       | `tests/unit/` | 素のNode         | 純粋なロジック、サーバールート、規約の検査 |
| `nuxt`       | `tests/nuxt/` | Nuxtのランタイム | コンポーネント、レイアウト、ページ         |

```bash
npm run test -- --project unit
```

外部APIへは実通信しない。CSIとFargoRateの応答はテスト側で差し替えている。

## ライセンス

[MIT License](LICENSE)
