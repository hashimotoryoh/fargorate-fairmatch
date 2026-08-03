import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#imports'
import { createError, readBody } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import GuestPage from '../../../app/pages/guest.vue'
import { jaMessage } from '../../helpers/i18n'
import { createGuestPlayer } from '../../helpers/fixtures'
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
} from '../../../shared/utils/guestPlayer'

const {
  routeQuery,
  navigateToMock,
  refreshSessionMock,
  executeRecaptchaMock,
  guestHandler,
} = vi.hoisted(() => ({
  routeQuery: { redirect: undefined as unknown },
  navigateToMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  executeRecaptchaMock: vi.fn(),
  guestHandler: vi.fn(),
}))

mockNuxtImport('useRoute', () => () => ({ query: routeQuery }))
mockNuxtImport('navigateTo', () => navigateToMock)
mockNuxtImport('useUserSession', () => () => ({
  fetch: refreshSessionMock,
  loggedIn: { value: false },
}))
// 実ブラウザでのreCAPTCHAスクリプト読み込みはテスト環境では発生させない。
mockNuxtImport('useRecaptcha', () => () => ({ execute: executeRecaptchaMock }))

registerEndpoint('/api/auth/guest', { method: 'POST', handler: guestHandler })

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

function nameInput(component: VueWrapper) {
  return component.find('input[type="text"]')
}

function ratingInput(component: VueWrapper) {
  return component.find('input[type="number"]')
}

/** 送信して、読み込み中の表示が消える（＝処理が終わる）まで待つ。 */
async function submit(component: VueWrapper) {
  await component.find('form').trigger('submit')
  await flushPromises()
  await vi.waitFor(() =>
    expect(component.html()).not.toContain('loading-spinner'),
  )
}

describe('ゲストページ', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await useLocale('ja')
    routeQuery.redirect = undefined
    executeRecaptchaMock.mockResolvedValue('test-token')
    guestHandler.mockReturnValue(createGuestPlayer())
  })

  /**
   * 未認証で誰でも叩けるルートなので、ボットにセッションを量産されないよう
   * reCAPTCHAを通す。アクション名を機能ごとに分けているため、ここが他の機能の
   * 名前になっていると管理コンソールでの分析が濁る。
   */
  it('reCAPTCHAのアクションに guest を使い、トークンを送る', async () => {
    const component = await mountSuspended(GuestPage)

    await ratingInput(component).setValue('450')
    await submit(component)

    expect(executeRecaptchaMock).toHaveBeenCalledWith('guest')
    expect(await readBody(guestHandler.mock.calls[0]![0])).toMatchObject({
      recaptchaToken: 'test-token',
    })
  })

  it('reCAPTCHAで弾かれたら知らせ、遷移しない', async () => {
    guestHandler.mockImplementation(() => {
      throw createError({
        statusCode: 422,
        statusMessage: 'reCAPTCHA verification failed',
      })
    })

    const component = await mountSuspended(GuestPage)

    await ratingInput(component).setValue('450')
    await submit(component)

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('guest.errors.recaptchaFailed'),
    )
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  it('名前とレーティングの入力欄を出す', async () => {
    const component = await mountSuspended(GuestPage)

    expect(component.find('h1').text()).toBe(jaMessage('guest.heading'))
    // 名前は任意なので required を付けない。
    expect(nameInput(component).attributes('required')).toBeUndefined()
    expect(nameInput(component).attributes('maxlength')).toBe(
      String(GUEST_NAME_MAX_LENGTH),
    )
    expect(ratingInput(component).attributes('required')).toBeDefined()
    expect(ratingInput(component).attributes('min')).toBe(
      String(GUEST_RATING_MIN),
    )
    expect(ratingInput(component).attributes('max')).toBe(
      String(GUEST_RATING_MAX),
    )
  })

  it('名前とレーティングを送ってゲストとして始める', async () => {
    const component = await mountSuspended(GuestPage)
    await nameInput(component).setValue('Jiro Suzuki')
    await ratingInput(component).setValue('450')
    await submit(component)

    expect(guestHandler).toHaveBeenCalledTimes(1)
    await expect(readBody(guestHandler.mock.calls[0]![0])).resolves.toEqual({
      name: 'Jiro Suzuki',
      rating: 450,
      recaptchaToken: 'test-token',
    })
    expect(refreshSessionMock).toHaveBeenCalledTimes(1)
    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  // 既定名は言語で変わるため、セッションには持たせず null で送る。
  it('名前が未入力なら null を送る', async () => {
    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('450')
    await submit(component)

    await expect(readBody(guestHandler.mock.calls[0]![0])).resolves.toEqual({
      name: null,
      rating: 450,
      recaptchaToken: 'test-token',
    })
  })

  it('名前の前後の空白を落として送る', async () => {
    const component = await mountSuspended(GuestPage)
    await nameInput(component).setValue('  Jiro Suzuki  ')
    await ratingInput(component).setValue('450')
    await submit(component)

    await expect(readBody(guestHandler.mock.calls[0]![0])).resolves.toEqual({
      name: 'Jiro Suzuki',
      rating: 450,
      recaptchaToken: 'test-token',
    })
  })

  it.each([
    ['未入力', ''],
    ['下限未満', String(GUEST_RATING_MIN - 1)],
    ['上限超過', String(GUEST_RATING_MAX + 1)],
    ['小数', '450.5'],
  ])('レーティングが%sなら送信せずに知らせる', async (_label, value) => {
    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue(value)
    await submit(component)

    expect(guestHandler).not.toHaveBeenCalled()
    expect(component.find('[role="alert"]').text()).toBe(
      jaMessage('guest.errors.invalidRating', {
        min: String(GUEST_RATING_MIN),
        max: String(GUEST_RATING_MAX),
      }),
    )
  })

  it('レーティング 0 は受け付ける', async () => {
    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('0')
    await submit(component)

    await expect(readBody(guestHandler.mock.calls[0]![0])).resolves.toEqual({
      name: null,
      rating: 0,
      recaptchaToken: 'test-token',
    })
  })

  it('開始に失敗したら知らせ、遷移しない', async () => {
    guestHandler.mockImplementation(() => {
      throw createError({ statusCode: 400, statusMessage: 'invalid' })
    })

    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('450')
    await submit(component)

    expect(component.find('[role="alert"]').text()).toBe(
      jaMessage('guest.errors.invalidInput'),
    )
    expect(navigateToMock).not.toHaveBeenCalled()
  })

  // 保護ページから追い返された人を、認証後に元の行き先へ戻す。
  it('redirect クエリの行き先へ戻す', async () => {
    routeQuery.redirect = '/settings'

    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('450')
    await submit(component)

    expect(navigateToMock).toHaveBeenCalledWith('/settings')
  })

  // URLから誰でも与えられる値なので、外部サイトへは飛ばさない。
  it('外部サイトへのリダイレクトを受け付けない', async () => {
    routeQuery.redirect = 'https://example.com/phishing'

    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('450')
    await submit(component)

    expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
  })

  it('英語で見ているときは英語のページへ移動する', async () => {
    await useLocale('en')

    const component = await mountSuspended(GuestPage)
    await ratingInput(component).setValue('450')
    await submit(component)

    expect(navigateToMock).toHaveBeenCalledWith('/en/dashboard')
  })

  it('FargoRateとのリンクへ戻るリンクを出し、行き先を引き継ぐ', async () => {
    routeQuery.redirect = '/settings'

    const component = await mountSuspended(GuestPage)
    const link = component
      .findAll('a')
      .find((anchor) => anchor.text() === jaMessage('guest.fargorateLink'))

    expect(link?.attributes('href')).toBe('/link?redirect=/settings')
  })
})
