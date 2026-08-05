import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AppFooter from '../../../app/components/AppFooter.vue'
import {
  footerLegalNavItems,
  footerStartNavItems,
  footerSupportNavItems,
} from '../../../app/utils/navigation'
import { jaMessage } from '../../helpers/i18n'

const REPOSITORY_URL = 'https://github.com/hashimotoryoh/fargorate-fairrace'

describe('AppFooter', () => {
  it('ブランドエリアにロゴと名前とアプリの説明を出す', async () => {
    const component = await mountSuspended(AppFooter)
    const aside = component.find('aside')

    expect(aside.text()).toContain('FargoRate FairRace')
    expect(aside.text()).toContain(jaMessage('index.lead'))
  })

  // Nuxtのブランドガイドラインの公式ロゴ画像を使う。既定のダークテーマでは
  // 白文字のロゴを選ぶ。
  it('ブランドエリアに Built with とNuxtのロゴを出す', async () => {
    const component = await mountSuspended(AppFooter)
    const aside = component.find('aside')

    expect(aside.text()).toContain(jaMessage('footer.builtWith'))
    expect(aside.find('img').attributes('alt')).toBe('Nuxt')
    expect(aside.find('img').attributes('src')).toContain(
      '/img/nuxt/logo-green-white.svg',
    )
  })

  /**
   * ドキュメントと、認証の要らない機能はどのページからも辿れる必要がある。
   * フッターは両方のレイアウトから使うため、ここに導線があれば全ページを賄える。
   * とくにプレイヤー検索は、未認証のユーザーにはヘッダーのボタンとここだけが
   * 経路になる。
   */
  it('ページ内の導線をすべて出す', async () => {
    const component = await mountSuspended(AppFooter)
    const items = [
      ...footerStartNavItems,
      ...footerSupportNavItems,
      ...footerLegalNavItems,
    ]

    for (const item of items) {
      expect(component.find(`a[href="${item.to}"]`).text()).toBe(
        jaMessage(item.labelKey),
      )
    }
  })

  it('Support欄にバグ報告と llms.txt への導線を出す', async () => {
    const component = await mountSuspended(AppFooter)
    const reportBug = component.find(`a[href="${REPOSITORY_URL}/issues/new"]`)
    const llmsTxt = component.find('a[href="/llms.txt"]')

    expect(reportBug.text()).toBe(jaMessage('footer.reportBug'))
    expect(llmsTxt.text()).toBe('llms.txt')
  })

  it('Legal欄からライセンスの全文へ繋ぐ', async () => {
    const component = await mountSuspended(AppFooter)
    const license = component.find(
      `a[href="${REPOSITORY_URL}/blob/main/LICENSE"]`,
    )

    expect(license.text()).toBe(jaMessage('footer.license'))
  })

  // 見出しは footer-title で揃える。並びは Support → Legal → Frameworks →
  // Thanks で、翻訳キーの取り違えを検出するため全件を確かめる。
  it('リンク集の見出しを並べる', async () => {
    const component = await mountSuspended(AppFooter)

    expect(
      component.findAll('.footer-title').map((title) => title.text()),
    ).toEqual([
      jaMessage('footer.support'),
      jaMessage('footer.legal'),
      jaMessage('footer.frameworks'),
      jaMessage('footer.thanks'),
    ])
  })

  it('FrameworksとThanksの外部リンクを出す', async () => {
    const component = await mountSuspended(AppFooter)

    for (const href of [
      'https://nuxt.com/',
      'https://daisyui.com/',
      'https://www.fargorate.com/',
      'https://www.playcsipool.com/',
      'https://github.com/',
      'https://claude.com/',
    ]) {
      expect(component.find(`a[href="${href}"]`).exists()).toBe(true)
    }
  })

  it('著作権表示とリポジトリへのリンクを出す', async () => {
    const component = await mountSuspended(AppFooter)
    const repository = component.find(`a[href="${REPOSITORY_URL}"]`)

    expect(component.text()).toContain('© 2026')
    expect(component.text()).toContain('Ryoh Hashimoto')
    expect(repository.attributes('aria-label')).toBe(
      jaMessage('footer.repository'),
    )
  })

  // 外部サイトを新しいタブで開くため、逆参照を渡さない指定を必ず添える。
  it('外部リンクに rel="noopener" を付ける', async () => {
    const component = await mountSuspended(AppFooter)
    const links = component.findAll('a[target="_blank"]')

    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link.attributes('rel')).toBe('noopener')
    }
  })
})
