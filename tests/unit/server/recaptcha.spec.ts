import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyRecaptchaToken } from '../../../server/utils/recaptcha'

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'

type MockedResponse = unknown | (() => never)

function stubFetch(response: MockedResponse) {
  const fetchMock = vi.fn((url: string) => {
    if (url !== RECAPTCHA_VERIFY_URL) {
      throw new Error(`模していないURLが呼ばれた: ${url}`)
    }
    if (typeof response === 'function') {
      return (response as () => never)()
    }

    return Promise.resolve(response)
  })

  vi.stubGlobal('$fetch', fetchMock)

  return fetchMock
}

function verifyResponse(overrides: Record<string, unknown> = {}) {
  return { success: true, score: 0.9, action: 'link', ...overrides }
}

describe('verifyRecaptchaToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  // クライアント側（useRecaptcha）も開発環境ではトークンの取得を省くため、
  // トークンが無くても通ることまで保証する。
  it('開発環境ならトークンが無くても外部APIを呼ばずに通す', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const fetchMock = stubFetch(verifyResponse())

    await expect(
      verifyRecaptchaToken(undefined, 'link'),
    ).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('成功かつスコアが閾値以上、actionが一致すれば通す', async () => {
    stubFetch(verifyResponse())

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).resolves.toBeUndefined()
  })

  it('success が false なら 422 を投げる', async () => {
    stubFetch(verifyResponse({ success: false }))

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({
      statusCode: 422,
      statusMessage: 'reCAPTCHA verification failed',
    })
  })

  it('スコアが閾値未満なら 422 を投げる', async () => {
    stubFetch(verifyResponse({ score: 0.1 }))

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('actionが一致しなければ 422 を投げる', async () => {
    stubFetch(verifyResponse({ action: 'other' }))

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  // v2のキーを設定すると、応答は success:true でも score を含まない形になる。
  // スコア不明を「人間」と誤って扱わないこと。`action` は一致させ、
  // 落ちる理由が score の欠如だけになるようにしてある。
  it('応答に score が無ければ 422 を投げる', async () => {
    stubFetch({
      success: true,
      action: 'link',
      challenge_ts: '2026-08-01T00:00:00Z',
    })

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it.each([
    ['未指定', undefined],
    ['空文字', ''],
    ['文字列以外', 123],
  ])(
    'トークンが%sなら外部APIを呼ばずに 422 を投げる',
    async (_label, token) => {
      const fetchMock = stubFetch(verifyResponse())

      await expect(verifyRecaptchaToken(token, 'link')).rejects.toMatchObject({
        statusCode: 422,
      })
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('外部APIに到達できなければ 502 を投げる', async () => {
    stubFetch(() => {
      throw new Error('network error')
    })

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the reCAPTCHA verification API',
    })
  })

  // 設定漏れで secret key が空のまま本番稼働すると、全リクエストが
  // reCAPTCHA失敗（422）に見えてしまい気づけない。500で明示的に落とす。
  it('シークレットキーが未設定なら外部APIを呼ばずに 500 を投げる', async () => {
    vi.stubGlobal('useRuntimeConfig', () => ({
      recaptchaSecretKey: '',
      public: { recaptchaSiteKey: 'test-site-key' },
    }))
    const fetchMock = stubFetch(verifyResponse())

    await expect(
      verifyRecaptchaToken('valid-token', 'link'),
    ).rejects.toMatchObject({
      statusCode: 500,
      statusMessage: 'NUXT_RECAPTCHA_SECRET_KEY is not configured',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
