/**
 * スコアボードを横向きで使わせるための補助。
 *
 * Screen Orientation API の `lock` はAndroidの全画面時にしか効かず、
 * iOS Safari は対応していない。ロックは試みるだけにして失敗は握り潰し、
 * 縦向きの間は呼び出し側がオーバーレイで回転を促す。
 */
export function useLandscapeLock() {
  const isPortrait = ref(false)
  // タブレットやデスクトップの縦長ウィンドウにまでオーバーレイを出さない。
  const isNarrow = ref(false)

  let portraitQuery: MediaQueryList | null = null
  let narrowQuery: MediaQueryList | null = null

  function update() {
    isPortrait.value = portraitQuery?.matches ?? false
    isNarrow.value = narrowQuery?.matches ?? false
  }

  onMounted(() => {
    portraitQuery = window.matchMedia('(orientation: portrait)')
    narrowQuery = window.matchMedia('(max-width: 767px)')
    update()
    portraitQuery.addEventListener('change', update)
    narrowQuery.addEventListener('change', update)
  })

  onUnmounted(() => {
    portraitQuery?.removeEventListener('change', update)
    narrowQuery?.removeEventListener('change', update)
  })

  const promptVisible = computed(() => isPortrait.value && isNarrow.value)

  /**
   * 全画面と横向きのロックを試みる。fullscreen はユーザー操作の中でしか
   * 要求できないため、プレイ開始などのタップを起点に呼ぶこと。
   */
  async function request() {
    try {
      await document.documentElement.requestFullscreen()
    } catch {
      // 全画面にできない環境ではオーバーレイでの誘導に任せる。
    }

    try {
      // TypeScriptの型定義から外れた実装依存のAPIのため、存在を確かめて呼ぶ。
      const orientation = screen.orientation as ScreenOrientation & {
        lock?: (orientation: string) => Promise<void>
      }
      await orientation.lock?.('landscape')
    } catch {
      // ロックできない環境ではオーバーレイでの誘導に任せる。
    }
  }

  async function release() {
    try {
      screen.orientation.unlock()
    } catch {
      // ロックしていなければ何もすることがない。
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
    } catch {
      // 全画面でなければ何もすることがない。
    }
  }

  return { promptVisible, request, release }
}
