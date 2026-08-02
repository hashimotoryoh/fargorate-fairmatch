import { execSync } from 'node:child_process'
import { createResolver } from 'nuxt/kit'
import tailwindcss from '@tailwindcss/vite'

const { resolve } = createResolver(import.meta.url)

const REPOSITORY_URL = 'https://github.com/hashimotoryoh/fargorate-fairmatch'

/**
 * 公開URLのオリジン。OGPやcanonical、hreflang の絶対URLの組み立てに使う。
 *
 * i18n の `baseUrl` はモジュールの設定として与える必要があり、実行時の
 * `runtimeConfig` からは読めない。環境変数を増やすと片方だけ設定された
 * 状態が起きうるため、ここで一度だけ読んで全ての用途で使い回す。
 */
const SITE_URL = process.env.NUXT_PUBLIC_SITE_URL ?? ''

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

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  // sitemap は i18n が組み立てたルートを読むため、最後に置く。
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/icon',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
  ],
  typescript: {
    strict: true,
  },
  icon: {
    // daisyUIのドックやヘッダーでは `currentColor` に色を委ねたいため、
    // CSSの背景画像ではなくインラインSVGで描く。
    mode: 'svg',
    // アプリロゴを `custom:app-logo` として使えるようにする。
    customCollections: [
      {
        prefix: 'custom',
        dir: resolve('./app/assets/icons'),
      },
    ],
    // vitestの `nuxt` プロジェクトはNitroのアイコン配信APIを持たないため、
    // アイコンデータをクライアントバンドルへ静的に含めてネットワーク取得を
    // 避ける。ロゴは `<Icon name="custom:app-logo">` と静的に書いているため
    // スキャンで拾える。Vitestは既定で `NODE_ENV=test` を立てる。
    ...(process.env.NODE_ENV === 'test'
      ? {
          provider: 'none',
          clientBundle: {
            scan: true,
            includeCustomCollections: true,
          },
        }
      : {}),
  },
  i18n: {
    defaultLocale: 'ja',
    // 日本語は接頭辞なしのURLに保つ。既存のURLを変えずに済み、
    // canonical も `/` 基準の素直な形になる。
    strategy: 'prefix_except_default',
    locales: [
      // `name` はセレクトボックスに出す表示名。読めない言語に切り替えた人が
      // 戻ってこられるよう、翻訳せずそれぞれの言語の自称表記のままにする。
      { code: 'ja', language: 'ja-JP', name: '日本語', file: 'ja.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    lazy: true,
    // hreflang の絶対URLに使う。空のうちは相対URLになるため、
    // `app.vue` 側で該当のメタタグそのものを出さない。
    baseUrl: SITE_URL,
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      // 振り分けるのはルート（`/`）に来たときだけにする。全てのページで
      // 振り分けると、共有された `/en/privacy-policy` を日本語話者が開いた
      // ときに日本語へ飛ばされ、リンクの指す先が読めなくなる。
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'ja',
    },
  },
  site: { url: SITE_URL },
  sitemap: {
    /**
     * 検索エンジンに載せるのは認証の要らないページだけで、これは公開ページと
     * 一致する。ロケール接頭辞の付いたパスは i18n との連携が自動で広げるため、
     * 接頭辞なしのパスだけを挙げれば足りる。
     *
     * ここは保護ページの列挙になるため、`app/pages/` から導いた保護ページを
     * 網羅していることを `tests/unit/repository/page-protection.spec.ts` で
     * 機械的に確かめている。追加漏れをレビューに頼らないため。
     */
    exclude: ['/dashboard', '/game', '/settings'],
  },
  css: ['@/assets/css/main.css'],
  content: {
    experimental: {
      // Nuxt Content は既定で better-sqlite3 を要求し、無ければ対話的に
      // インストールを促す。Node.js 22.5 以降に同梱の `node:sqlite` を使えば
      // ネイティブ依存を足さずに済み、CIでもビルドが止まらない。
      sqliteConnector: 'native',
    },
  },
  app: {
    head: {
      // `lang` は @nuxtjs/i18n の useLocaleHead が現在のロケールから立てる。
      // ここで固定すると二重指定になる。
      // daisyUI の dock がセーフエリアを避けるために viewport-fit=cover が要る。
      viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
      titleTemplate: '%s | FargoRate FairMatch',
    },
  },
  runtimeConfig: {
    // reCAPTCHA v3 のシークレットキー。サーバー側での検証にのみ使うため public
    // には置かない。
    recaptchaSecretKey: '',
    public: {
      commitSha: resolveCommitSha(),
      repositoryUrl: REPOSITORY_URL,
      // OGP や canonical で必要な絶対URLの組み立てに使う。
      // 未設定のうちは絶対URLを作れないため、該当するメタを出力しない。
      siteUrl: SITE_URL,
      // reCAPTCHA v3 のサイトキー。クライアント側のスクリプト読み込みに使う。
      recaptchaSiteKey: '',
    },
  },
  // 保護ページに prerender や ISR/SWR のルートルールを足してはならない。
  // nuxt-auth-utils はプリレンダ・キャッシュ時にサーバー側のセッション取得を
  // 飛ばすため、ミドルウェアが認証済みユーザーを未認証と判定してしまう。
  vite: {
    plugins: [tailwindcss()],
  },
})
