import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  return { success: true, score: 0.9, action: 'lookup', ...overrides }
}

describe('verifyRecaptchaToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('成功かつスコアが閾値以上、actionが一致すれば通す', async () => {
    stubFetch(verifyResponse())

    await expect(
      verifyRecaptchaToken('valid-token', 'lookup'),
    ).resolves.toBeUndefined()
  })

  it('success が false なら 422 を投げる', async () => {
    stubFetch(verifyResponse({ success: false }))

    await expect(
      verifyRecaptchaToken('valid-token', 'lookup'),
    ).rejects.toMatchObject({
      statusCode: 422,
      statusMessage: 'reCAPTCHA verification failed',
    })
  })

  it('スコアが閾値未満なら 422 を投げる', async () => {
    stubFetch(verifyResponse({ score: 0.1 }))

    await expect(
      verifyRecaptchaToken('valid-token', 'lookup'),
    ).rejects.toMatchObject({ statusCode: 422 })
  })

  it('action が一致しなければ 422 を投げる', async () => {
    stubFetch(verifyResponse({ action: 'other' }))

    await expect(
      verifyRecaptchaToken('valid-token', 'lookup'),
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

      await expect(verifyRecaptchaToken(token, 'lookup')).rejects.toMatchObject(
        { statusCode: 422 },
      )
      expect(fetchMock).not.toHaveBeenCalled()
    },
  )

  it('外部APIに到達できなければ 502 を投げる', async () => {
    stubFetch(() => {
      throw new Error('network error')
    })

    await expect(
      verifyRecaptchaToken('valid-token', 'lookup'),
    ).rejects.toMatchObject({
      statusCode: 502,
      statusMessage: 'Failed to reach the reCAPTCHA verification API',
    })
  })
})
