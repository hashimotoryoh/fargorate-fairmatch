import {
  mockNuxtImport,
  mountSuspended,
  registerEndpoint,
} from '@nuxt/test-utils/runtime'
import { createError } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import LookupPage from '../../../app/pages/lookup.vue'
import { jaMessage } from '../../helpers/i18n'
import { FARGORATE_ID } from '../../helpers/fixtures'
import {
  PLAYER_QUERY_MAX_LENGTH,
  PLAYER_QUERY_MIN_LENGTH,
} from '../../../shared/utils/playerQuery'

const { executeRecaptchaMock, lookupHandler } = vi.hoisted(() => ({
  executeRecaptchaMock: vi.fn(),
  lookupHandler: vi.fn(),
}))

// 実ブラウザでのreCAPTCHAスクリプト読み込みはテスト環境では発生させない。
mockNuxtImport('useRecaptcha', () => () => ({ execute: executeRecaptchaMock }))

registerEndpoint('/api/players/lookup', {
  method: 'POST',
  handler: lookupHandler,
})

function createSearchResult(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Taro Yamada',
    readableId: '1234567',
    fargorateId: FARGORATE_ID,
    location: 'Tokyo',
    rating: 523,
    robustness: 412,
    ...overrides,
  }
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

describe('プレイヤー検索ページ', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    executeRecaptchaMock.mockResolvedValue('test-token')
    lookupHandler.mockReturnValue([createSearchResult()])
  })

  it('名前の入力欄と検索ボタンを出す', async () => {
    const component = await mountSuspended(LookupPage)

    expect(component.text()).toContain(jaMessage('lookup.heading'))
    expect(component.text()).toContain(jaMessage('lookup.queryLabel'))
    expect(component.find('input[type="text"]').attributes('maxlength')).toBe(
      String(PLAYER_QUERY_MAX_LENGTH),
    )
    expect(component.find('button[type="submit"]').text()).toContain(
      jaMessage('lookup.submit'),
    )
  })

  // 検索する前から「見つかりませんでした」と出ていては読み手が混乱する。
  it('検索する前は結果の欄を出さない', async () => {
    const component = await mountSuspended(LookupPage)

    expect(component.text()).not.toContain(jaMessage('lookup.resultsHeading'))
    expect(component.text()).not.toContain(jaMessage('lookup.empty'))
  })

  it('ヒットしたプレイヤーをカードで見せ、レーティングと信頼度をstatに出す', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(lookupHandler).toHaveBeenCalledTimes(1)
    expect(component.text()).toContain(jaMessage('lookup.resultsHeading'))

    const card = component.get('.card')
    expect(card.text()).toContain('Taro Yamada')

    const stats = card.findAll('.stat')
    expect(stats).toHaveLength(2)
    expect(stats[0]?.text()).toContain(jaMessage('player.rating'))
    expect(stats[0]?.text()).toContain('523')
    expect(stats[1]?.text()).toContain(jaMessage('player.robustness'))
    expect(stats[1]?.text()).toContain('412')
  })

  it('名前の下に所在地を出す', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(component.get('.card').text()).toContain('Tokyo')
  })

  // 所在地は空で返ることがある。枠だけが残ると読み手に伝わるものが無い。
  it('所在地が無ければその行を出さない', async () => {
    lookupHandler.mockReturnValue([createSearchResult({ location: null })])

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(component.get('.card').text()).not.toContain('Tokyo')
  })

  it('複数ヒットしたらカードを並べる', async () => {
    lookupHandler.mockReturnValue([
      createSearchResult({ name: 'Taro Yamada' }),
      createSearchResult({ name: 'Jiro Yamada', readableId: '7654321' }),
    ])

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Yamada')

    expect(component.findAll('.card')).toHaveLength(2)
    expect(component.text()).toContain('Jiro Yamada')
  })

  // IDを持たないプレイヤーが混じっても、描画で落ちてはならない。
  it('IDが無いプレイヤーも一覧に出す', async () => {
    lookupHandler.mockReturnValue([
      createSearchResult({ readableId: null, fargorateId: null }),
    ])

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Yamada')

    expect(component.findAll('.card')).toHaveLength(1)
  })

  it('0件なら見つからなかったことを伝える', async () => {
    lookupHandler.mockReturnValue([])

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Nobody Here')

    expect(component.text()).toContain(jaMessage('lookup.empty'))
  })

  // 短すぎるうちは、外部APIまで問い合わせない。
  it('短すぎる入力は送信せずその場で知らせる', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'a')

    expect(lookupHandler).not.toHaveBeenCalled()
    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('lookup.errors.invalidQuery', {
        min: String(PLAYER_QUERY_MIN_LENGTH),
        max: String(PLAYER_QUERY_MAX_LENGTH),
      }),
    )
  })

  it('reCAPTCHAで弾かれたら知らせる', async () => {
    lookupHandler.mockImplementation(() => {
      throw createError({
        statusCode: 422,
        statusMessage: 'reCAPTCHA verification failed',
      })
    })

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('lookup.errors.recaptchaFailed'),
    )
  })

  it('通信に失敗したら知らせる', async () => {
    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 502, statusMessage: 'Bad Gateway' })
    })

    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(component.find('[role="alert"]').text()).toContain(
      jaMessage('lookup.errors.unexpected'),
    )
  })

  // 入力を弾くときも、結果とエラーの整合が取れるよう前回の結果を消す。
  it('短すぎる入力を弾くときも前回の検索結果を消す', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')
    expect(component.text()).toContain('Taro Yamada')

    await fillAndSubmit(component, 'a')

    expect(component.text()).not.toContain(jaMessage('lookup.resultsHeading'))
  })

  // 前回の結果を残したままエラーを出すと、どちらの検索の結果か読めなくなる。
  it('失敗したら前回の検索結果を消す', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')
    expect(component.text()).toContain('Taro Yamada')

    lookupHandler.mockImplementation(() => {
      throw createError({ statusCode: 502, statusMessage: 'Bad Gateway' })
    })
    await fillAndSubmit(component, 'Jiro Yamada')

    expect(component.text()).not.toContain(jaMessage('lookup.resultsHeading'))
  })

  /**
   * アクション名は機能ごとに分けてある。ここが `link` になっていると、
   * reCAPTCHAの管理コンソールでリンクの導線と区別が付かなくなる。
   */
  it('reCAPTCHAのアクションに playerLookup を使う', async () => {
    const component = await mountSuspended(LookupPage)

    await fillAndSubmit(component, 'Taro Yamada')

    expect(executeRecaptchaMock).toHaveBeenCalledWith('playerLookup')
  })
})
