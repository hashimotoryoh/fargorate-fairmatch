import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useRuntimeConfig } from '#imports'
import { afterEach, describe, expect, it } from 'vitest'
import AppFooter from '../../../app/components/AppFooter.vue'

const REPOSITORY_URL = 'https://github.com/hashimotoryoh/fargorate-fairmatch'
const COMMIT_SHA = '0123456789abcdef0123456789abcdef01234567'

function setPublicConfig(overrides: { commitSha?: string }) {
  Object.assign(useRuntimeConfig().public, overrides)
}

describe('AppFooter', () => {
  afterEach(() => {
    setPublicConfig({ commitSha: '' })
  })

  it('著作権表示とライセンスへのリンクを出す', async () => {
    const component = await mountSuspended(AppFooter)
    const license = component.find(
      `a[href="${REPOSITORY_URL}/blob/main/LICENSE"]`,
    )

    expect(component.text()).toContain('© 2026')
    expect(component.text()).toContain('Ryoh Hashimoto')
    expect(license.text()).toBe('MIT License')
  })

  /**
   * プライバシーポリシーと利用規約はどのページからも辿れる必要がある。
   * フッターは両方のレイアウトから使うため、ここに導線があれば全ページを賄える。
   */
  it('プライバシーポリシーと利用規約へのリンクを出す', async () => {
    const component = await mountSuspended(AppFooter)

    expect(component.find('a[href="/privacy"]').text()).toBe(
      'プライバシーポリシー',
    )
    expect(component.find('a[href="/terms"]').text()).toBe('利用規約')
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

  it('コミットハッシュを先頭7桁でGitHubのコミットへ繋ぐ', async () => {
    setPublicConfig({ commitSha: COMMIT_SHA })

    const component = await mountSuspended(AppFooter)
    const version = component.find('a.font-mono')

    expect(version.text()).toBe('0123456')
    expect(version.attributes('href')).toBe(
      `${REPOSITORY_URL}/commit/${COMMIT_SHA}`,
    )
  })

  // `.git` を持たないビルド環境ではハッシュを解決できない。
  it('コミットハッシュが無ければバージョン表示ごと省く', async () => {
    setPublicConfig({ commitSha: '' })

    const component = await mountSuspended(AppFooter)

    expect(component.find('a.font-mono').exists()).toBe(false)
  })
})
