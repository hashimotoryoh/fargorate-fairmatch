import { execSync } from 'node:child_process'
import tailwindcss from '@tailwindcss/vite'

const REPOSITORY_URL = 'https://github.com/hashimotoryoh/fargorate-fairmatch'

/**
 * フッターのバージョン表示に使うコミットハッシュを解決する。
 *
 * デプロイ先が未定なので、主要なホスティングが注入する環境変数を順に見て、
 * どれも無ければローカルの git から取る。`.git` を持たないビルド環境では
 * 空文字を返し、フッター側でバージョン表示そのものを省く。
 */
function resolveCommitSha(): string {
  const fromEnv =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.GITHUB_SHA ??
    process.env.CF_PAGES_COMMIT_SHA ??
    process.env.COMMIT_REF ??
    process.env.RENDER_GIT_COMMIT

  if (fromEnv) {
    return fromEnv
  }

  try {
    return execSync('git rev-parse HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

// 個人のレーティングを含むため、検索エンジンに拾わせないページ。
const PRIVATE_ROUTES = ['/dashboard', '/game', '/settings']

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', 'nuxt-auth-utils'],
  typescript: {
    strict: true,
  },
  css: ['@/assets/css/main.css'],
  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      // daisyUI の dock がセーフエリアを避けるために viewport-fit=cover が要る。
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      titleTemplate: '%s | FargoRate FairMatch',
    },
  },
  runtimeConfig: {
    public: {
      commitSha: resolveCommitSha(),
      repositoryUrl: REPOSITORY_URL,
      // OGP や canonical で必要な絶対URLの組み立てに使う。
      // 未設定のうちは絶対URLを作れないため、該当するメタを出力しない。
      siteUrl: '',
    },
  },
  // メタタグでの noindex に加えてヘッダーでも指示する。HTML以外のレスポンスや
  // リダイレクトも対象になるため。
  //
  // なお保護ページに prerender や ISR/SWR のルートルールを付けてはならない。
  // nuxt-auth-utils はプリレンダ・キャッシュ時にサーバー側のセッション取得を
  // 飛ばすため、ミドルウェアが認証済みユーザーを未認証と判定してしまう。
  routeRules: Object.fromEntries(
    PRIVATE_ROUTES.map((route) => [
      route,
      { headers: { 'x-robots-tag': 'noindex, nofollow' } },
    ]),
  ),
  vite: {
    plugins: [tailwindcss()],
  },
})
