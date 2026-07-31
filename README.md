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

## ページ

| ルート       | 用途                             | 認証 |
| ------------ | -------------------------------- | ---- |
| `/`          | アプリの紹介                     | 不要 |
| `/lookup`    | FargoRate IDでのサインイン       | 不要 |
| `/dashboard` | 自分のレーティングなどの表示     | 必要 |
| `/game`      | 種目を選んで新しいゲームを始める | 必要 |
| `/settings`  | サインアウトなどの設定           | 必要 |

検索エンジンにインデックスさせるのは `/` と `/lookup` のみで、これは認証なしでアクセスできるページと一致する。

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

`NUXT_PUBLIC_SITE_URL` は公開URLのオリジンで、OGPやcanonicalの絶対URLの組み立てに使う。開発中は空のままでよい。空の場合はそれらのメタタグを出力しない。

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

## ライセンス

[MIT License](LICENSE)
