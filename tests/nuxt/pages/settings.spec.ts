import { mockNuxtImport, mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { Icon } from '#components'
import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import SettingsPage from '../../../app/pages/settings.vue'
import { jaMessage } from '../../helpers/i18n'
import {
  createGuestPlayer,
  createFargoRatePlayer,
} from '../../helpers/fixtures'

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

// サインアウトのボタンは独立したグループの中央揃えのボタンであり、
// DOM順で最初のボタンとは限らないため、文言で特定する。表示中のロケールで
// 探さないと、英語表示のテストで見つからなくなる。
function findSignOutButton(
  component: Awaited<ReturnType<typeof mountSuspended>>,
) {
  const signOutLabel = useNuxtApp().$i18n.t('settings.signOut')
  const button = component
    .findAll('button')
    .find((button) => button.text().includes(signOutLabel))

  if (!button) {
    throw new Error('サインアウトのボタンが見つかりません')
  }

  return button
}

describe('設定ページ', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await useLocale('ja')
    session.user = ref(createFargoRatePlayer())
    clearMock.mockResolvedValue(undefined)
  })

  it('利用中のプレイヤーを名前とFargoRate IDで示す', async () => {
    const component = await mountSuspended(SettingsPage)

    expect(component.find('h1').text()).toBe(jaMessage('settings.heading'))
    expect(component.text()).toContain('Taro Yamada')
    expect(component.text()).toContain('9900001234567')
  })

  // ゲストには見せるIDが無い。自己申告である旨も併せて伝える。
  it('ゲストはFargoRate IDを伴わない文言で示す', async () => {
    session.user = ref(createGuestPlayer())

    const component = await mountSuspended(SettingsPage)

    expect(component.text()).toContain(
      jaMessage('settings.playingAsGuest', { name: 'Jiro Suzuki' }),
    )
  })

  it('名前が未入力のゲストは既定名で示す', async () => {
    session.user = ref(createGuestPlayer({ name: null }))

    const component = await mountSuspended(SettingsPage)

    expect(component.text()).toContain(
      jaMessage('settings.playingAsGuest', {
        name: jaMessage('player.guestName'),
      }),
    )
  })

  it('プレイヤー情報が無い間はアカウントの説明を出さない', async () => {
    session.user = ref(null)

    const component = await mountSuspended(SettingsPage)

    expect(component.text()).not.toContain('Taro Yamada')
    expect(component.text()).not.toContain('9900001234567')
    expect(findSignOutButton(component).exists()).toBe(true)
  })

  it('サインアウトするとセッションを破棄してトップページへ移動する', async () => {
    const component = await mountSuspended(SettingsPage)

    await findSignOutButton(component).trigger('click')
    await flushPromises()

    expect(clearMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/')
  })

  // サインアウトでロケールを落とすと、英語で使っていた人が日本語のトップに着く。
  it('英語で見ているときは英語のトップページへ移動する', async () => {
    await useLocale('en')

    const component = await mountSuspended(SettingsPage)

    await findSignOutButton(component).trigger('click')
    await flushPromises()

    expect(navigateToMock).toHaveBeenCalledWith('/en')
  })

  it('テーマの切り替えを出す', async () => {
    const component = await mountSuspended(SettingsPage)

    expect(component.text()).toContain(jaMessage('settings.theme'))
    expect(
      component
        .findAllComponents(Icon)
        .map((icon) => icon.props('name'))
        .includes('mdi:theme-light-dark'),
    ).toBe(true)
  })

  // Dockにはタブを追加しない方針のため、設定画面がブログへの唯一の導線になる。
  it('ブログページへのリンクを出す', async () => {
    const component = await mountSuspended(SettingsPage)
    const link = component.find('a[href="/blog"]')

    expect(link.exists()).toBe(true)
    expect(component.text()).toContain(jaMessage('settings.blogDescription'))
  })

  // Dockやヘッダーのメインナビにはfaqを追加しない方針のため、フッターに加えて
  // 設定画面もFAQへの導線になる。
  it('FAQページへのリンクを出す', async () => {
    const component = await mountSuspended(SettingsPage)
    const link = component.find('a[href="/faq"]')

    expect(link.exists()).toBe(true)
    expect(component.text()).toContain(jaMessage('settings.faqDescription'))
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
    await findSignOutButton(component).trigger('click')

    expect(findSignOutButton(component).attributes('disabled')).toBeDefined()
    expect(component.find('.loading-spinner').exists()).toBe(true)

    resolveClear?.()
    await flushPromises()
  })
})
