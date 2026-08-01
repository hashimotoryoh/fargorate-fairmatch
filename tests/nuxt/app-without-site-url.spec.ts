import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it, vi } from 'vitest'
import App from '../../app/app.vue'

function head(selector: string) {
  return document.head.querySelector(selector)
}

/**
 * 公開URLが未設定のときの `app/app.vue`。
 *
 * 「出さない」ことを確かめるには、他のテストが出したタグが残っていない head が
 * 要る。unhead はコンポーネントを外してもタグをDOMに残すため、公開URLを設定
 * するテストとはファイルごと分ける。Vitestはファイル単位で環境を作り直す。
 */
describe('アプリのルートコンポーネント（公開URLが未設定）', () => {
  /**
   * 誤ったドメインを指す canonical は、正しいURLが無いことより害がある。
   * 公開URLが分からないうちは、絶対URLを要するメタを出さない。
   */
  it('canonical と og:url と hreflang を出さない', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('meta[property="og:site_name"]')).not.toBeNull()
    })
    expect(head('link[rel="canonical"]')).toBeNull()
    expect(head('meta[property="og:url"]')).toBeNull()
    expect(head('link[rel="alternate"]')).toBeNull()
    expect(head('meta[property="og:locale"]')).toBeNull()
  })

  // 言語は絶対URLを要さないため、公開URLの有無によらず必ず伝える。
  it('html の lang は出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(document.documentElement.getAttribute('lang')).toBe('ja-JP')
    })
  })
})
