import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRecaptcha } from '../../../app/composables/useRecaptcha'

// `useRuntimeConfig` はNuxtのコンテキストを要するため、コンポーネントに
// マウントして呼び出す。
const TestComponent = defineComponent({
  template: '<div />',
  setup() {
    return useRecaptcha()
  },
})

type Exposed = { execute: (action: string) => Promise<string> }

type StubScript = {
  src: string
  onload: (() => void) | null
  onerror: (() => void) | null
}

/**
 * happy-domは外部URL付きのscriptタグを実際に読み込もうとして失敗させてしまう
 * ため、`document.createElement` を差し替えて読み込みの成否を明示的に制御する。
 */
function stubScriptTag(): StubScript {
  const script: StubScript = { src: '', onload: null, onerror: null }
  vi.spyOn(document, 'createElement').mockReturnValue(
    script as unknown as HTMLScriptElement,
  )
  vi.spyOn(document.head, 'appendChild').mockImplementation(
    (node) => node as never,
  )
  return script
}

describe('useRecaptcha', () => {
  beforeEach(() => {
    delete (window as { grecaptcha?: unknown }).grecaptcha
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('スクリプトの読み込みに失敗しても、次回呼び出しで再試行できる', async () => {
    const component = await mountSuspended(TestComponent)
    const { execute } = component.vm as unknown as Exposed
    const script = stubScriptTag()

    const first = execute('link')
    script.onerror?.()
    await expect(first).rejects.toThrow()

    window.grecaptcha = {
      ready: (callback) => callback(),
      execute: async () => 'test-token',
    }

    await expect(execute('link')).resolves.toBe('test-token')
  })

  it('スクリプトは読み込めても grecaptcha が定義されなければ拒否する', async () => {
    const component = await mountSuspended(TestComponent)
    const { execute } = component.vm as unknown as Exposed
    const script = stubScriptTag()

    const promise = execute('link')
    script.onload?.()

    await expect(promise).rejects.toThrow()
  })
})
