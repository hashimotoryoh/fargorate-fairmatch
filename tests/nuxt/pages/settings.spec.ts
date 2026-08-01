import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SettingsPage from '../../../app/pages/settings.vue'
import { jaMessage } from '../../helpers/i18n'
import { createPlayerProfile } from '../../helpers/fixtures'

// セッションはテンプレートで自動アンラップされる ref として渡す必要がある。
// ref はモジュールの読み込み後にしか作れないため、入れ物だけを巻き上げる。
const { session, clearMock, navigateToMock } = vi.hoisted(() => ({
  session: { user: undefined as unknown },
  clearMock: vi.fn(),
  navigateToMock: vi.fn(),
}))

mockNuxtImport('useUserSession', () => () => ({
  user: session.user,
  clear: clearMock,
}))
mockNuxtImport('navigateTo', () => navigateToMock)

/**
 * ロケールを切り替える。
 *
 * `setLocale` は自身もそのロケールのURLへの遷移を起こすため、
 * 落ち着かせてから navigateTo の記録を消す。
 */
async function useLocale(code: 'ja' | 'en') {
  await useNuxtApp().$i18n.setLocale(code)
  await flushPromises()
  navigateToMock.mockClear()
}

describe('設定ページ', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await useLocale('ja')
    session.user = ref(createPlayerProfile())
    clearMock.mockResolvedValue(undefined)
  })

  it('サインイン中のプレイヤーを姓名とFargoRate IDで示す', async () => {
    const component = await mountSuspended(SettingsPage)

    expect(component.find('h1').text()).toBe(jaMessage('settings.heading'))
    expect(component.text()).toContain('Taro Yamada')
    expect(component.text()).toContain('9900001234567')
  })

  it('プレイヤー情報が無い間はアカウントの説明を出さない', async () => {
    session.user = ref(null)

    const component = await mountSuspended(SettingsPage)

    expect(component.text()).not.toContain('Taro Yamada')
    expect(component.text()).not.toContain('9900001234567')
    expect(component.find('button').exists()).toBe(true)
  })

  it('サインアウトするとセッションを破棄してトップページへ移動する', async () => {
    const component = await mountSuspended(SettingsPage)

    await component.find('button').trigger('click')
    await flushPromises()

    expect(clearMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  // サインアウトでロケールを落とすと、英語で使っていた人が日本語のトップに着く。
  it('英語で見ているときは英語のトップページへ移動する', async () => {
    await useLocale('en')

    const component = await mountSuspended(SettingsPage)

    await component.find('button').trigger('click')
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith('/en')
  })

  // 二度押しで破棄と移動が重ならないよう、処理中はボタンを無効にする。
  it('サインアウトの処理中はボタンを無効にする', async () => {
    let resolveClear: (() => void) | undefined
    clearMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveClear = resolve
      }),
    )

    const component = await mountSuspended(SettingsPage)
    await component.find('button').trigger('click')

    expect(component.find('button').attributes('disabled')).toBeDefined()
    expect(component.find('.loading-spinner').exists()).toBe(true)

    resolveClear?.()
    await flushPromises()
  })
})
