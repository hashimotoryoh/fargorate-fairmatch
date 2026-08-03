import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { clearNuxtData, useRuntimeConfig } from '#imports'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import FaqPage from '../../../app/pages/faq.vue'
import { createFaqItem } from '../../helpers/fixtures'
import { jaMessage } from '../../helpers/i18n'

const { queryCollectionMock, allMock } = vi.hoisted(() => {
  const allMock = vi.fn()

  return {
    allMock,
    // `queryCollection('faq_ja').all()` の連鎖を模す。
    queryCollectionMock: vi.fn(() => ({ all: allMock })),
  }
})

mockNuxtImport('queryCollection', () => queryCollectionMock)

const SITE_URL = 'https://fairrace.example'

function setSiteUrl(siteUrl: string | undefined) {
  Object.assign(useRuntimeConfig().public, { siteUrl })
}

function head(selector: string) {
  return document.head.querySelector(selector)
}

describe('FAQページ', () => {
  // useAsyncData はロケール単位でキャッシュするため、テストごとに一覧を洗い直す。
  beforeEach(() => {
    clearNuxtData()
    setSiteUrl(undefined)
    allMock.mockReset()
    allMock.mockResolvedValue([
      // わざと行番号の逆順・2桁を含む順で返し、並び替えを確かめる。
      createFaqItem(2, '2番目の質問', '2番目の回答'),
      createFaqItem(10, '10番目の質問', '10番目の回答'),
      createFaqItem(1, '1番目の質問', '1番目の回答'),
    ])
  })

  it('質問の数だけアコーディオンを描画する', async () => {
    const component = await mountSuspended(FaqPage)

    expect(component.findAll('.collapse').length).toBe(3)
  })

  it('CSVの行番号順（数値順）に並べる', async () => {
    const component = await mountSuspended(FaqPage)

    const titles = component.findAll('.collapse-title')
    expect(titles.map((title) => title.text())).toEqual([
      '1番目の質問',
      '2番目の質問',
      '10番目の質問',
    ])
  })

  it('各項目の質問と回答を出す', async () => {
    const component = await mountSuspended(FaqPage)

    expect(component.find('.collapse-title').text()).toBe('1番目の質問')
    expect(component.find('.collapse-content').text()).toContain('1番目の回答')
  })

  it('初期状態ではチェックボックスが全て未チェックである', async () => {
    const component = await mountSuspended(FaqPage)

    const checkboxes = component.findAll('input[type="checkbox"]')
    expect(checkboxes.length).toBe(3)
    for (const checkbox of checkboxes) {
      expect((checkbox.element as HTMLInputElement).checked).toBe(false)
    }
  })

  it('質問文に一致するキーワードで絞り込める', async () => {
    const component = await mountSuspended(FaqPage)

    await component.find('input[type="search"]').setValue('10番目')

    const titles = component.findAll('.collapse-title')
    expect(titles.map((title) => title.text())).toEqual(['10番目の質問'])
  })

  it('回答文に一致するキーワードでも絞り込める', async () => {
    const component = await mountSuspended(FaqPage)

    await component.find('input[type="search"]').setValue('2番目の回答')

    const titles = component.findAll('.collapse-title')
    expect(titles.map((title) => title.text())).toEqual(['2番目の質問'])
  })

  it('該当する質問が無ければ空状態のメッセージを出す', async () => {
    const component = await mountSuspended(FaqPage)

    await component
      .find('input[type="search"]')
      .setValue('該当しないキーワード')

    expect(component.text()).toContain(jaMessage('faq.empty'))
    expect(component.findAll('.collapse').length).toBe(0)
  })

  // NUXT_PUBLIC_SITE_URL が無い間は絶対URLを組めないため、構造化データを出さない。
  it('siteUrlが無ければFAQPageの構造化データを出さない', async () => {
    await mountSuspended(FaqPage)

    expect(head('script[type="application/ld+json"]')).toBeNull()
  })

  it('siteUrlがあればFAQPageの構造化データを、検索の絞り込みに関わらず全件分埋め込む', async () => {
    setSiteUrl(SITE_URL)

    const component = await mountSuspended(FaqPage)
    await component.find('input[type="search"]').setValue('10番目')

    await vi.waitFor(() => {
      expect(head('script[type="application/ld+json"]')).not.toBeNull()
    })

    const json = JSON.parse(
      head('script[type="application/ld+json"]')?.textContent ?? '{}',
    )

    expect(json['@type']).toBe('FAQPage')
    expect(json.mainEntity).toHaveLength(3)
    expect(json.mainEntity[0]).toEqual({
      '@type': 'Question',
      name: '1番目の質問',
      acceptedAnswer: { '@type': 'Answer', text: '1番目の回答' },
    })
  })
})
