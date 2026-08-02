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

  it('セッションのプレイヤー情報をFargoRate IDごと見せる', async () => {
    const component = await mountSuspended(DashboardPage)

    expect(component.find('h1').text()).toBe(jaMessage('dashboard.heading'))
    expect(component.text()).toContain('Taro Yamada')
    expect(component.text()).toContain('523')
    expect(component.text()).toContain('FargoRate ID')
    expect(component.text()).toContain('9900001234567')
  })

  it('ゲームを始める導線を置く', async () => {
    const component = await mountSuspended(DashboardPage)
    const link = component.find('a[href="/game"]')

    expect(link.exists()).toBe(true)
    expect(link.text()).toBe(jaMessage('dashboard.startGame'))
  })

  // セッションの復元が済むまで `user` は null になりうる。
  it('プレイヤー情報が無い間は表を出さない', async () => {
    session.user = ref(null)

    const component = await mountSuspended(DashboardPage)

    expect(component.find('table').exists()).toBe(false)
    expect(component.find('a[href="/game"]').exists()).toBe(true)
  })
})
