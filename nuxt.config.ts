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
 * 認証が必要な保護ページのパス。sitemapの除外とrobots.txtのDisallowの
 * 両方でこの1つだけを参照し、列挙を二重管理にしない。ロケール接頭辞付きの
 * パス（`/en/...`）は@nuxtjs/sitemapと@nuxtjs/robotsがi18nの設定から
 * 自動で展開するため、接頭辞なしのパスだけを挙げれば足りる。
 *
 * ここは保護ページの列挙になるため、`app/pages/` から導いた保護ページを
 * 網羅していることを `tests/unit/repository/page-protection.spec.ts` で
 * 機械的に確かめている。追加漏れをレビューに頼らないため。
 */
const PROTECTED_PAGE_PATHS = ['/dashboard', '/game', '/settings']

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
  // sitemap は i18n が組み立てたルートを読むため、i18nの後に置く。
  // robots は Sitemap: 行の組み立てに sitemap の設定を読むため、さらに後に置く。
  modules: [
    '@nuxt/content',
    // @nuxt/content が起動時にこのモジュールを検出し、page コレクションを
    // llms.txt へ渡すフック連携を自動で行うため、@nuxt/content より後に置く。
    'nuxt-llms',
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@nuxtjs/robots',
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
    // 検索エンジンに載せるのは認証の要らないページだけで、これは公開ページと
    // 一致する。保護ページの列挙は PROTECTED_PAGE_PATHS に一本化してある。
    exclude: PROTECTED_PAGE_PATHS,
    /**
     * `/blog/[slug]` は動的ルートで、ルート定義からはスラッグを列挙できない。
     * `server/api/__sitemap__/blog.ts` が Nuxt Content から記事のパスを
     * 集めて返す（`_i18nTransform` によりロケール接頭辞付きのURLとhreflangは
     * 自動で組み立てられる）。
     */
    sources: ['/api/__sitemap__/blog'],
  },
  // robots.txt はこのモジュールが動的に生成する（public/robots.txt は置かない）。
  // Sitemap: 行は site.url と @nuxtjs/sitemap の連携から自動で組み立てられる。
  robots: {
    disallow: PROTECTED_PAGE_PATHS,
  },
  /**
   * AIクローラー・エージェント向けの `/llms.txt`（https://llmstxt.org/）。
   *
   * このアプリの i18n は `prefix_except_default`（既定の `ja` は接頭辞なし、
   * `en` は `/en`）だが、`nuxt-llms` はロケールを意識しない単一のルートしか
   * 生成しない。ロケールごとに分けず、英語の単一ファイルとして公開する
   * 方針にしてある（`robots.txt` も単一ファイルである前例に揃えた）。
   * 本文中のリンクも英語ロケールのURL（`/en/...`）を指す。
   *
   * `sections` は `documents_en`・`blog_en` だけを参照し、`documents_ja`・
   * `blog_ja` は参照しない。日本語コレクションを足すと英語限定の方針が
   * 崩れるため、`tests/unit/repository/llms-txt.spec.ts` で機械的に
   * 検査している。
   *
   * FAQ（`faq_en`）のセクションはここには無い。`contentCollection` は
   * `type: 'page'` 前提（`path`/`title`列を要求）で、個別ページを持たない
   * `type: 'data'` のFAQには使えないため、`server/plugins/llms-faq.ts` の
   * `llms:generate` フックで動的に足している。
   */
  llms: {
    domain: SITE_URL,
    title: 'FargoRate FairRace',
    // documents_ja/documents_en、blog_ja/blog_en はそれぞれ日英で同じパスを
    // 共有しており（例: /privacy-policy、/blog/<スラッグ>）、`/raw/*.md` は
    // 最初に見つかったコレクションを返すだけでロケールを見分けない。日本語
    // コレクションを対象から外すことで、`/raw/privacy-policy.md` が確実に
    // documents_en の英語本文を返すようにする。
    contentRawMarkdown: {
      excludeCollections: ['documents_ja', 'blog_ja'],
    },
    description:
      'A web app that helps you enter and review pool match scores on top of FargoRate ratings. Your FargoRate ID is all you need to get started. It reads ratings from the official FargoRate system but never sends match results back, so it never updates your rating.',
    sections: [
      {
        title: 'Getting Started',
        links: [
          {
            title: 'Home',
            description:
              'What FargoRate FairRace does and how FargoRate ratings work.',
            href: '/en',
          },
          {
            title: 'Link your FargoRate',
            description:
              'Link your FargoRate player profile with the 13-digit FargoRate ID shown on your player card in the FargoRate app.',
            href: '/en/link',
          },
          {
            title: 'Start as a guest',
            description:
              'Start without a FargoRate ID by entering a name and a self-reported rating.',
            href: '/en/guest',
          },
        ],
      },
      {
        title: 'Legal',
        contentCollection: 'documents_en',
      },
      {
        title: 'Blog',
        contentCollection: 'blog_en',
      },
    ],
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
      titleTemplate: '%s | FargoRate FairRace',
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
