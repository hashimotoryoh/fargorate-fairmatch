import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { createError, readBody } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import LinkPage from '../../../app/pages/link.vue'
import { jaMessage } from '../../helpers/i18n'
import { FARGORATE_ID, createFargoRatePlayer } from '../../helpers/fixtures'

const {
  routeQuery,
  navigateToMock,
  refreshSessionMock,
  executeRecaptchaMock,
  lookupHandler,
  sessionHandler,
} = vi.hoisted(() => ({
  routeQuery: { redirect: undefined as unknown },
  navigateToMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  executeRecaptchaMock: vi.fn(),
  lookupHandler: vi.fn(),
  sessionHandler: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  fetch: refreshSessionMock,
  loggedIn: { value: false },
}))
// 実ブラウザでのreCAPTCHAスクリプト読み込みはテスト環境では発生させない。
mockNuxtImport('useRecaptcha', () => () => ({ execute: executeRecaptchaMock }))

registerEndpoint('/api/link/lookup', { method: 'POST', handler: lookupHandler })
registerEndpoint('/api/auth/session', {
  method: 'POST',
  handler: sessionHandler,
})

function notFound() {
  throw createError({ statusCode: 404, statusMessage: 'Player not found' })
}

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

/** 送信して、読み込み中の表示が消える（＝処理が終わる）まで待つ。 */
async function fillAndSubmit(component: VueWrapper, value: string) {
  await component.find('input[type="text"]').setValue(value)
  await component.find('form').trigger('submit')
  await flushPromises()
  await vi.waitFor(() =>
    expect(component.html()).not.toContain('loading-spinner'),
  )
}

/**
 * サジェストの削除ボタンを探す。
 *
 * 削除対象を区別できるよう、aria-labelにはアカウントごとの名前とレーティング
 * が含まれ一意になる。共通の末尾文言だけをキーから取り出し、それで絞り込む。
 */
function findRemoveButtons(component: VueWrapper) {
  const suffix = jaMessage('link.recentAccounts.remove', {
    name: '',
  }).trim()

  return component
    .findAll('button')
    .filter((button) => button.attributes('aria-label')?.endsWith(suffix))
}

describe('リンクページ', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    localStorage.clear()
    await useLocale('ja')
    routeQuery.redirect = undefined
    executeRecaptchaMock.mockResolvedValue('test-token')
    lookupHandler.mockReturnValue(createFargoRatePlayer())
    sessionHandler.mockReturnValue(createFargoRatePlayer())
  })

  it('FargoRate IDの入力欄と検索ボタンを出す', async () => {
    const component = await mountSuspended(LinkPage)
    const input = component.find('input[type="text"]')

    expect(component.text()).toContain(jaMessage('link.heading'))
    expect(input.attributes('inputmode')).toBe('numeric')
    expect(input.attributes('maxlength')).toBe('13')
    expect(component.find('button[type="submit"]').text()).toContain(
      jaMessage('link.submit'),
    )
  })

  it('IDの調べ方への導線を置く', async () => {
    const component = await mountSuspended(LinkPage)

    expect(component.text()).toContain(jaMessage('fargorateIdGuide.trigger'))
  })

  // 形式が明らかに不正なうちは、外部APIまで問い合わせない。
  it('13桁でないIDは送信せずその場で知らせる', async () => {
    const component = await mountSuspended(LinkPage)

    await fillAndSubmit(component, '123')

    expect(lookupHandler).not.toHaveBeenCalled()
    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('link.errors.invalidId'),
    )
  })

  it('見つかったプレイヤーを本人確認の画面で見せる', async () => {
    const component = await mountSuspended(LinkPage)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(lookupHandler).toHaveBeenCalledTimes(1)
    expect(component.text()).toContain(jaMessage('link.confirmQuestion'))
    expect(component.text()).toContain('Taro Yamada')
    expect(component.text()).toContain('523')
    expect(component.find('form').exists()).toBe(false)
  })

  // 確認画面ではユーザーが今まさに入力したIDなので、改めては出さない。
  it('本人確認の画面にFargoRate IDを出さない', async () => {
    const component = await mountSuspended(LinkPage)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.text()).not.toContain(FARGORATE_ID)
  })

  it('該当が無ければ見つからなかったことを知らせる', async () => {
    lookupHandler.mockImplementation(notFound)

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('link.errors.notFound'),
    )
    expect(component.find('form').exists()).toBe(true)
  })

  it('外部APIに到達できなければ通信の失敗として知らせる', async () => {
    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 502 })
    })

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('link.errors.unexpected'),
    )
  })

  it('reCAPTCHAの検証に失敗したらその旨を知らせる', async () => {
    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 422 })
    })

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('link.errors.recaptchaFailed'),
    )
  })

  it('本人だと答えるとセッションを確定してダッシュボードへ移動する', async () => {
    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(sessionHandler).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  // 入力欄の値ではなく、ルックアップで得たプレイヤーのIDでリンクを確定する。
  // 状態が食い違った場合に、ユーザーが確認していない別IDでリンクしないため。
  it('確認画面ではルックアップで得たプレイヤーのIDでリンクを確定する', async () => {
    const candidateId = '9900009999999'
    lookupHandler.mockReturnValue(
      createFargoRatePlayer({ fargorateId: candidateId }),
    )
    sessionHandler.mockImplementation(async (event) => {
      expect(await readBody(event)).toEqual({ fargorateId: candidateId })
      return createFargoRatePlayer({ fargorateId: candidateId })
    })

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(sessionHandler).toHaveBeenCalledTimes(1)
  })

  it('元々開こうとしていたページへ戻す', async () => {
    routeQuery.redirect = '/game'

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/game')
  })

  // `redirect` はURLから誰でも与えられるため、外部サイトへは飛ばさない。
  it('外部サイトを指す redirect を既定の遷移先へ倒す', async () => {
    routeQuery.redirect = 'https://example.com'

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  /**
   * `resolveRedirectPath` はロケールを知らない純粋な関数に保っている。
   * ロケールの付与はページ側の責任であり、落とすと英語で始めた人が日本語の
   * ダッシュボードに着く。
   */
  it('英語で見ているときは英語のページへ戻す', async () => {
    await useLocale('en')

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/en/dashboard')
  })

  // `redirect` には auth ミドルウェアがロケール付きのパスを入れる。
  // ページ側で改めて通しても二重には付かない。
  it('ロケールを含む redirect をそのまま使う', async () => {
    routeQuery.redirect = '/en/game'
    await useLocale('en')

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(navigateToMock).toHaveBeenCalledWith('/en/game')
  })

  it('確定に失敗したら移動せずに知らせる', async () => {
    sessionHandler.mockImplementation(notFound)

    const component = await mountSuspended(LinkPage)
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

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() =>
      expect(component.find('[role="alert"]').exists()).toBe(true),
    )

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('link.errors.invalidId'),
    )
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('本人でないと答えるとID入力へ戻す', async () => {
    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[1]?.trigger('click')
    await component.vm.$nextTick()

    expect(component.find('form').exists()).toBe(true)
    expect(component.text()).not.toContain(jaMessage('link.confirmQuestion'))
  })

  it('やり直したときに前の失敗を残さない', async () => {
    lookupHandler.mockImplementationOnce(notFound)

    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').exists()).toBe(true)

    await fillAndSubmit(component, FARGORATE_ID)

    expect(component.find('[role="alert"]').exists()).toBe(false)
  })

  const SECOND_ACCOUNT = {
    fargorateId: '9900007654321',
    name: 'Jiro Suzuki',
    rating: 400,
  }

  // FargoRate IDを持たない人が行き止まりにならないようにする。
  it('ゲストページへの導線を出し、行き先を引き継ぐ', async () => {
    routeQuery.redirect = '/settings'

    const component = await mountSuspended(LinkPage)
    const link = component
      .findAll('a')
      .find((anchor) => anchor.text() === jaMessage('link.guestLink'))

    expect(link?.attributes('href')).toBe('/guest?redirect=/settings')
  })

  it('過去に本人確認したアカウントが無ければサジェストを出さない', async () => {
    const component = await mountSuspended(LinkPage)

    expect(component.text()).not.toContain(
      jaMessage('link.recentAccounts.label'),
    )
  })

  // 生のFargoRate IDではなく、名前とレーティングでサジェストする。
  it('過去に本人確認したアカウントを名前とレーティングでサジェストする', async () => {
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([
        { fargorateId: FARGORATE_ID, name: 'Taro Yamada', rating: 523 },
      ]),
    )

    const component = await mountSuspended(LinkPage)

    expect(component.text()).toContain(jaMessage('link.recentAccounts.label'))
    expect(component.text()).toContain('Taro Yamada (523)')
    expect(component.text()).not.toContain(FARGORATE_ID)
  })

  // 壊れた値でも例外を握りつぶし、サジェスト無しで入力を続けられるようにする。
  it('localStorageの値が壊れていてもサジェスト無しで続行する', async () => {
    localStorage.setItem('fairmatch:recentAccounts', '{not valid json')

    const component = await mountSuspended(LinkPage)

    expect(component.text()).not.toContain(
      jaMessage('link.recentAccounts.label'),
    )
  })

  // 保存形式が想定より多件数になっていても、表示件数の上限（直近5件）を崩さない。
  it('保存件数が上限を超えていても直近5件までしかサジェストしない', async () => {
    const accounts = Array.from({ length: 7 }, (_, i) => ({
      fargorateId: String(9900000000000 + i),
      name: `Player ${i}`,
      rating: 400 + i,
    }))
    localStorage.setItem('fairmatch:recentAccounts', JSON.stringify(accounts))

    const component = await mountSuspended(LinkPage)

    expect(findRemoveButtons(component)).toHaveLength(5)
  })

  // 選んだ時点で本人だとわかっているため、IDの入力や確認画面を経由しない。
  it('サジェストを選ぶと確認画面を経ずに直接リンクを確定する', async () => {
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([
        { fargorateId: FARGORATE_ID, name: 'Taro Yamada', rating: 523 },
      ]),
    )

    const component = await mountSuspended(LinkPage)
    await component
      .findAll('button')
      .find((button) => button.text() === 'Taro Yamada (523)')
      ?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(lookupHandler).not.toHaveBeenCalled()
    expect(sessionHandler).toHaveBeenCalledTimes(1)
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')

    const input = component.find('input[type="text"]')
      .element as HTMLInputElement
    expect(input.value).toBe('')
  })

  // サジェストは古いスナップショットの可能性があるため、サーバーが
  // 再ルックアップした最新の情報で記憶を上書きする。
  it('サジェストからのリンクでは、サーバーが返した最新の情報を記憶する', async () => {
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([SECOND_ACCOUNT]),
    )
    sessionHandler.mockReturnValue(
      createFargoRatePlayer({
        fargorateId: SECOND_ACCOUNT.fargorateId,
        name: SECOND_ACCOUNT.name,
        rating: 450,
      }),
    )

    const component = await mountSuspended(LinkPage)
    await component
      .findAll('button')
      .find((button) => button.text() === 'Jiro Suzuki (400)')
      ?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(
      JSON.parse(localStorage.getItem('fairmatch:recentAccounts') ?? '[]'),
    ).toEqual([{ ...SECOND_ACCOUNT, rating: 450 }])
  })

  it('サジェストでの直接リンクに失敗したら知らせる', async () => {
    sessionHandler.mockImplementation(notFound)
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([SECOND_ACCOUNT]),
    )

    const component = await mountSuspended(LinkPage)
    await component
      .findAll('button')
      .find((button) => button.text() === 'Jiro Suzuki (400)')
      ?.trigger('click')
    await vi.waitFor(() =>
      expect(component.find('[role="alert"]').exists()).toBe(true),
    )

    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('サジェストを個別に削除できる', async () => {
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([
        { fargorateId: FARGORATE_ID, name: 'Taro Yamada', rating: 523 },
        SECOND_ACCOUNT,
      ]),
    )

    const component = await mountSuspended(LinkPage)
    const removeButtons = findRemoveButtons(component)
    expect(removeButtons).toHaveLength(2)

    await removeButtons[0]?.trigger('click')

    expect(component.text()).not.toContain('Taro Yamada (523)')
    expect(component.text()).toContain('Jiro Suzuki (400)')
    expect(
      JSON.parse(localStorage.getItem('fairmatch:recentAccounts') ?? '[]'),
    ).toEqual([SECOND_ACCOUNT])
  })

  it('最後のサジェストを削除すると一覧ごと消える', async () => {
    localStorage.setItem(
      'fairmatch:recentAccounts',
      JSON.stringify([SECOND_ACCOUNT]),
    )

    const component = await mountSuspended(LinkPage)
    await findRemoveButtons(component)[0]?.trigger('click')

    expect(component.text()).not.toContain(
      jaMessage('link.recentAccounts.label'),
    )
  })

  it('本人だと確認すると次回のために名前とレーティングを記憶する', async () => {
    const component = await mountSuspended(LinkPage)
    await fillAndSubmit(component, FARGORATE_ID)

    await component.findAll('button')[0]?.trigger('click')
    await vi.waitFor(() => expect(navigateToMock).toHaveBeenCalled())

    expect(
      JSON.parse(localStorage.getItem('fairmatch:recentAccounts') ?? '[]'),
    ).toEqual([{ fargorateId: FARGORATE_ID, name: 'Taro Yamada', rating: 523 }])
  })
})
