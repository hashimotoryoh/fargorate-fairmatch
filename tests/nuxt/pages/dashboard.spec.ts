import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import DashboardPage from '../../../app/pages/dashboard.vue'
import { jaMessage } from '../../helpers/i18n'
import { createFargoRatePlayer } from '../../helpers/fixtures'

// セッションはテンプレートで自動アンラップされる ref として渡す必要がある。
// ref はモジュールの読み込み後にしか作れないため、入れ物だけを巻き上げる。
const session = vi.hoisted(() => ({ user: undefined as unknown }))

mockNuxtImport('useUserSession', () => () => ({ user: session.user }))

describe('ダッシュボードページ', () => {
  beforeEach(() => {
    session.user = ref(createFargoRatePlayer())
  })

  it('セッションのプレイヤーをカードで見せ、レーティングと信頼度をstatに出す', async () => {
    const component = await mountSuspended(DashboardPage)

    expect(component.find('h1').text()).toBe(jaMessage('dashboard.heading'))
    const card = component.get('.card')
    expect(card.text()).toContain('Taro Yamada')
    expect(card.text()).toContain('Tokyo')
    expect(card.findAll('.stat')).toHaveLength(2)
    expect(card.text()).toContain('523')
    expect(card.text()).toContain('412')
  })

  it('ゲームを始める導線を置く', async () => {
    const component = await mountSuspended(DashboardPage)
    const link = component.find('a[href="/games"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toBe(jaMessage('dashboard.startGame'))
  })

  // セッションの復元が済むまで `user` は null になりうる。
  it('プレイヤー情報が無い間はカードを出さない', async () => {
    session.user = ref(null)

    const component = await mountSuspended(DashboardPage)

    expect(component.find('.stat').exists()).toBe(false)
    expect(component.find('a[href="/games"]').exists()).toBe(true)
  })
})
