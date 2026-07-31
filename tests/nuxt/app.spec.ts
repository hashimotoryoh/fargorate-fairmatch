import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useRuntimeConfig } from '#imports'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../../app/app.vue'

const SITE_URL = 'https://fairmatch.example'

function setSiteUrl(siteUrl: string) {
  Object.assign(useRuntimeConfig().public, { siteUrl })
}

function head(selector: string) {
  return document.head.querySelector(selector)
}

describe('アプリのルートコンポーネント', () => {
  beforeEach(() => {
    setSiteUrl('')
    document.head
      .querySelectorAll('link[rel="canonical"], meta[property="og:url"]')
      .forEach((node) => node.remove())
  })

  afterEach(() => {
    setSiteUrl('')
  })

  it('サイト共通のOGPを出す', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(
        head('meta[property="og:site_name"]')?.getAttribute('content'),
      ).toBe('FargoRate FairMatch')
    })
    expect(head('meta[property="og:locale"]')?.getAttribute('content')).toBe(
      'ja_JP',
    )
  })

  /**
   * 誤ったドメインを指す canonical は、正しいURLが無いことより害がある。
   * 公開URLが分からないうちは、絶対URLを要するメタを出さない。
   */
  it('公開URLが未設定なら canonical と og:url を出さない', async () => {
    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('meta[property="og:site_name"]')).not.toBeNull()
    })
    expect(head('link[rel="canonical"]')).toBeNull()
    expect(head('meta[property="og:url"]')).toBeNull()
  })

  it('公開URLが設定されていれば canonical と og:url を絶対URLで出す', async () => {
    setSiteUrl(SITE_URL)

    await mountSuspended(App)

    await vi.waitFor(() => {
      expect(head('link[rel="canonical"]')?.getAttribute('href')).toBe(
        `${SITE_URL}/`,
      )
    })
    expect(head('meta[property="og:url"]')?.getAttribute('content')).toBe(
      `${SITE_URL}/`,
    )
  })
})
