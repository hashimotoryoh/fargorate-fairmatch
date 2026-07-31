import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import LookupPage from '../../../app/pages/lookup.vue'
import { FARGORATE_ID, createPlayerProfile } from '../../helpers/fixtures'

const {
  routeQuery,
  navigateToMock,
  refreshSessionMock,
  lookupHandler,
  sessionHandler,
} = vi.hoisted(() => ({
  routeQuery: { redirect: undefined as unknown },
  navigateToMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  lookupHandler: vi.fn(),
  sessionHandler: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  fetch: refreshSessionMock,
  loggedIn: { value: false },
}))

registerEndpoint('/api/lookup', { method: 'POST', handler: lookupHandler })
registerEndpoint('/api/auth/session', {
  method: 'POST',
  handler: sessionHandler,
})

function notFound() {
  throw createError({ statusCode: 404, statusMessage: 'Player not found' })
}

/** 送信して、読み込み中の表示が消える（＝処理が終わる）まで待つ。 */
async function fillAndSubmit(component: VueWrapper, value: string) {
  await component.find('input[type="text"]').setValue(value)
  await component.find('form').trigger('submit')
  await flushPromises()
  await vi.waitFor(() =>
    expect(component.html()).not.toContain('loading-spinner'),
  )
}

describe('サインインページ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery.redirect = undefined
    lookupHandler.mockReturnValue(createPlayerProfile())
    sessionHandler.mockReturnValue(createPlayerProfile())
  })

  it('FargoRate IDの入力欄と検索ボタンを出す', async () => {
    const component = await mountSuspended(LookupPage)
    const input = component.find('input[type="text"]')

    expect(component.text()).toContain('サインイン')
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('maxlength')).toBe('13')
    expect(component.find('button[type="submit"]').text()).toContain('検索する')
  })

  it('IDの調べ方への導線を置く', async () => {
    const component = await mountSuspended(LookupPage)

    expect(component.text()).toContain('FargoRate IDの確認方法')
  })

  // 形式が明らかに不正なうちは、外部APIまで問い合わせない。
  it('13桁でないIDは送信せずその場で知らせる', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, '123')

    expect(lookupHandler).not.toHaveBeenCalled()
    expect(component.find('[role="alert"]').text()).toContain(
      'FargoRate IDは13桁の数字で入力してください。',
    )
  })

  it('見つかったプレイヤーを本人確認の画面で見せる', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(lookupHandler).toHaveBeenCalledTimes(1)
    expect(component.text()).toContain('このプレイヤーはあなたですか？')
    expect(component.text()).toContain('Taro Yamada')
    expect(component.text()).toContain('523')
    expect(component.find('form').exists()).toBe(false)
  })

  // 確認画面ではユーザーが今まさに入力したIDなので、改めては出さない。
  it('本人確認の画面にFargoRate IDを出さない', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.text()).not.toContain(FARGORATE_ID)
  })

  it('該当が無ければ見つからなかったことを知らせる', async () => {
    lookupHandler.mockImplementation(notFound)

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').text()).toContain(
      'そのFargoRate IDのプレイヤーは見つかりませんでした。',
    )
    expect(component.find('form').exists()).toBe(true)
  })

  it('外部APIに到達できなければ通信の失敗として知らせる', async () => {
    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 502 })
    })

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').text()).toContain(
      '通信に失敗しました。',
    )
  })

  it('本人だと答えるとセッションを確定してダッシュボードへ移動する', async () => {
    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(sessionHandler).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('元々開こうとしていたページへ戻す', async () => {
    routeQuery.redirect = '/game'

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/game')
  })

  // `redirect` はURLから誰でも与えられるため、外部サイトへは飛ばさない。
  it('外部サイトを指す redirect を既定の遷移先へ倒す', async () => {
    routeQuery.redirect = 'https://example.com'

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('確定に失敗したら移動せずに知らせる', async () => {
    sessionHandler.mockImplementation(notFound)

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() =>
      expect(component.find('[role="alert"]').exists()).toBe(true),
    )

    expect(navigateToMock).not.toHaveBeenCalled()
    expect(refreshSessionMock).not.toHaveBeenCalled()
  })

  // クライアント側の検証を通っても、サーバー側の判定が食い違えば 400 が返る。
  it('サーバーが形式の不正を返したらその旨を知らせる', async () => {
    sessionHandler.mockImplementation(() => {
      throw createError({ statusCode: 400 })
    })

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() =>
      expect(component.find('[role="alert"]').exists()).toBe(true),
    )

    expect(component.find('[role="alert"]').text()).toContain(
      'FargoRate IDは13桁の数字で入力してください。',
    )
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('本人でないと答えるとID入力へ戻す', async () => {
    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[1]?.trigger('click')
    await component.vm.$nextTick()

    expect(component.find('form').exists()).toBe(true)
    expect(component.text()).not.toContain('このプレイヤーはあなたですか？')
  })

  it('やり直したときに前の失敗を残さない', async () => {
    lookupHandler.mockImplementationOnce(notFound)

    const component = await mountSuspended(LookupPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').exists()).toBe(true)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').exists()).toBe(false)
  })
})
