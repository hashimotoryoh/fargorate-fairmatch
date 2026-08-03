import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useRuntimeConfig } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../app/app.vue'

const SITE_URL = 'https://fairrace.example'

/**
 * 公開URLを差し替える。
 *
 * 絶対URLの組み立てに使う i18n の `baseUrl` はビルド時に固まるため、テスト
 * からは差し替えられない。ここで切り替えられるのは、絶対URLを要するメタを
 * 出すかどうかの判断だけである。1つの環境変数が3か所へ渡ることは
 * `tests/unit/repository/site-url.spec.ts` で見ている。
 */
function setSiteUrl(siteUrl: string) {
  Object.assign(useRuntimeConfig().public, { siteUrl })
}

function head(selector: string) {
  return document.head.querySelector(selector)
}

function headAll(selector: string) {
  return [...document.head.querySelectorAll(selector)]
}

describe('アプリのルートコンポーネント（公開URLが設定済み）', () => {
  beforeEach(() => {
    setSiteUrl(SITE_URL)
  })

  /**
   * サイト名と区切りは `templateParams` に一本化してある。ページ側で接尾辞を
   * 書き写さないため、ページのタイトルが無いときは区切りごと落ちてサイト名
   * だけが残る。
   */
  it('og:title をテンプレートから組み立てる', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('meta[property="og:title"]')?.getAttribute('content')).toBe(
        'FargoRate FairRace',
      )
    })
  })

  it('サイト共通のOGPを出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(
        head('meta[property="og:site_name"]')?.getAttribute('content'),
      ).toBe('FargoRate FairRace')
    })
  })

  // 表示中の言語を示す。固定していると、英語のページも日本語だと伝えてしまう。
  it('og:locale を表示中の言語で出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('meta[property="og:locale"]')?.getAttribute('content')).toBe(
        'ja_JP',
      )
    })
    expect(
      headAll('meta[property="og:locale:alternate"]').map((node) =>
        node.getAttribute('content'),
      ),
    ).toContain('en_US')
  })

  it('canonical と og:url を出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('link[rel="canonical"]')).not.toBeNull()
    })
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(
      head('link[rel="canonical"]')?.getAttribute('href'),
    )
  })

  /**
   * 言語ごとのURLを検索エンジンに伝える。既定のロケールを x-default に据えて、
   * どの言語にも当てはまらない利用者の行き先を示す。
   */
  it('全ての言語の hreflang を出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(headAll('link[rel="alternate"]').length).toBeGreaterThan(0)
    })

    const alternates = Object.fromEntries(
      headAll('link[rel="alternate"]').map((node) => [
        node.getAttribute('hreflang'),
        node.getAttribute('href'),
      ]),
    )

    expect(alternates['ja-JP']).toBe('/')
    expect(alternates['en-US']).toBe('/en')
    expect(alternates['x-default']).toBe('/')
  })
})
