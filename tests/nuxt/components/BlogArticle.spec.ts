import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp, useRuntimeConfig } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import BlogArticle from '../../../app/components/BlogArticle.vue'
import { createBlogArticle } from '../../helpers/fixtures'
import { jaMessage } from '../../helpers/i18n'

const { queryCollectionMock, firstMock, createErrorMock, navigateToMock } =
  vi.hoisted(() => {
    const firstMock = vi.fn()

    return {
      firstMock,
      navigateToMock: vi.fn(),
      // `queryCollection('blog_ja').path('/blog/...').first()` の連鎖を模す。
      queryCollectionMock: vi.fn(() => ({
        path: vi.fn(() => ({ first: firstMock })),
      })),
      createErrorMock: vi.fn(
        (options: { statusMessage?: string }) =>
          new Error(options.statusMessage),
      ),
    }
  })

mockNuxtImport('queryCollection', () => queryCollectionMock)
mockNuxtImport('createError', () => createErrorMock)
mockNuxtImport('navigateTo', () => navigateToMock)

const SITE_URL = 'https://fairrace.example'

function setSiteUrl(siteUrl: string) {
  Object.assign(useRuntimeConfig().public, { siteUrl })
}

function head(selector: string) {
  return document.head.querySelector(selector)
}

/** ロケールを切り替え、遷移が落ち着くまで待つ。 */
async function useLocale(code: 'ja' | 'en') {
  await useNuxtApp().$i18n.setLocale(code)
  await flushPromises()
}

describe('BlogArticle', () => {
  beforeEach(async () => {
    await useLocale('ja')
    setSiteUrl(SITE_URL)
    firstMock.mockReset()
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/blog-page-launch', 'ブログページを公開しました'),
    )
    queryCollectionMock.mockClear()
  })

  it('フロントマターの見出しとMarkdownの本文を出す', async () => {
    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    expect(component.find('h1').text()).toBe('ブログページを公開しました')
    expect(component.text()).toContain('ブログページを公開しましたの本文。')
  })

  it('渡されたパスの記事を引く', async () => {
    const pathMock = vi.fn(() => ({ first: firstMock }))
    queryCollectionMock.mockReturnValueOnce({ path: pathMock })

    await mountSuspended(BlogArticle, {
      props: { path: '/blog/other-article' },
    })

    expect(queryCollectionMock).toHaveBeenCalledWith('blog_ja')
    expect(pathMock).toHaveBeenCalledWith('/blog/other-article')
  })

  // ロケールごとに別のコレクションへ分けている。引き先を間違えると、英語で
  // 開いても日本語の文面が出る。
  it('英語で見ているときは英語のコレクションを引く', async () => {
    await useLocale('en')

    await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    expect(queryCollectionMock).toHaveBeenCalledWith('blog_en')
  })

  it('公開日を表示中の言語の表記で出す', async () => {
    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })
    const time = component.find('time')

    expect(component.text()).toContain(jaMessage('blog.publishedAt'))
    expect(time.attributes('datetime')).toBe('2026-08-01')
    expect(time.text()).toBe('2026年8月1日')
  })

  // 改訂日が無い記事では、公開日だけを見せ更新日の表記を出さない。
  it('updatedAtが無ければ更新日を出さない', async () => {
    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    expect(component.text()).not.toContain(jaMessage('blog.updatedAt'))
  })

  it('updatedAtがあれば更新日も出す', async () => {
    // useAsyncData はパスごとにキャッシュするため、別の記事と別のパスを使う。
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/with-update', 'アップデートのある記事', {
        updatedAt: '2026-08-02',
      }),
    )

    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/with-update' },
    })

    expect(component.text()).toContain(jaMessage('blog.updatedAt'))
    expect(component.findAll('time').at(1)?.text()).toBe('2026年8月2日')
  })

  it('記事はwebsiteではなくarticleとしてOGPに出す', async () => {
    await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    await vi.waitFor(() => {
      expect(head('meta[property="og:type"]')?.getAttribute('content')).toBe(
        'article',
      )
    })
    expect(
      head('meta[property="article:published_time"]')?.getAttribute('content'),
    ).toBe('2026-08-01')
  })

  // フロントマターに image が無ければ、サイト共通の既定OGP画像にフォールバックする。
  it('記事固有の画像が無ければ既定のOGP画像を使う', async () => {
    await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    await vi.waitFor(() => {
      expect(head('meta[property="og:image"]')?.getAttribute('content')).toBe(
        `${SITE_URL}/img/ogp.png`,
      )
    })
  })

  it('記事固有の画像があればそれをOGP画像に使う', async () => {
    // useAsyncData はパスごとにキャッシュするため、別の記事と別のパスを使う。
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/with-image', '画像のある記事', {
        image: '/img/content/blog/with-image.png',
      }),
    )

    await mountSuspended(BlogArticle, {
      props: { path: '/blog/with-image' },
    })

    await vi.waitFor(() => {
      expect(head('meta[property="og:image"]')?.getAttribute('content')).toBe(
        `${SITE_URL}/img/content/blog/with-image.png`,
      )
    })
  })

  // OGPと同じ画像を本文の見出し画像としても表示する。
  it('記事固有の画像があれば見出し画像に使う', async () => {
    firstMock.mockResolvedValue(
      createBlogArticle('/blog/with-heading-image', '見出し画像のある記事', {
        image: '/img/content/blog/with-heading-image.png',
      }),
    )

    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/with-heading-image' },
    })

    const image = component.find('img')
    expect(image.attributes('src')).toContain(
      '/img/content/blog/with-heading-image.png',
    )
    expect(image.attributes('alt')).toBe('見出し画像のある記事')
  })

  // フロントマターに image が無ければ、見出し画像も既定のOGP画像にフォールバックする。
  it('記事固有の画像が無ければ見出し画像に既定のOGP画像を使う', async () => {
    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    const image = component.find('img')
    expect(image.attributes('src')).toContain('/img/ogp.png')
  })

  it('Article形式の構造化データを埋め込む', async () => {
    await mountSuspended(BlogArticle, {
      props: { path: '/blog/blog-page-launch' },
    })

    await vi.waitFor(() => {
      expect(head('script[type="application/ld+json"]')).not.toBeNull()
    })

    const json = JSON.parse(
      head('script[type="application/ld+json"]')?.textContent ?? '{}',
    )

    expect(json['@type']).toBe('Article')
    expect(json.headline).toBe('ブログページを公開しました')
    expect(json.datePublished).toBe('2026-08-01')
    expect(json.mainEntityOfPage).toBe(`${SITE_URL}/blog/blog-page-launch`)
  })

  /**
   * Markdownを消したりスラッグを変えたりすると本文が引けなくなる。見出しだけの
   * 空のページを出すと気づけないため、404として扱う。
   */
  it('記事が見つからなければ404にする', async () => {
    firstMock.mockResolvedValue(null)

    // useAsyncData の結果はキーごとに使い回されるため、他のテストと別のパスを使う。
    const component = await mountSuspended(BlogArticle, {
      props: { path: '/blog/removed' },
    }).catch(() => null)

    expect(createErrorMock).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, fatal: true }),
    )
    expect(component?.find('h1').exists()).not.toBe(true)
  })
})
