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

## 認証

ユーザーはFargoRate ID（13桁の数値）のルックアップを通して認証される。入力されたIDでCSIメンバーシップルックアップAPIから姓名を引き、その姓名でFargoRateメンバーシップルックアップAPIを検索してレーティングを得る。表示されたプレイヤーが本人であることをユーザーが確認するとサインインが完了する。

未認証のユーザーは全てのページからルックアップページ `/lookup` へリダイレクトされる。

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
