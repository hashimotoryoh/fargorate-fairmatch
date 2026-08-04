/**
 * 対局中の画面消灯を防ぐ。マウント中だけ保持し、非対応環境では何もしない。
 * タブが背面に回るとOSがロックを解放するため、復帰時に取り直す。
 */
export function useWakeLock() {
  let sentinel: WakeLockSentinel | null = null

  async function acquire() {
    try {
      sentinel = (await navigator.wakeLock?.request('screen')) ?? null
    } catch {
      sentinel = null
    }
  }

  function reacquire() {
    if (document.visibilityState === 'visible') {
      acquire()
    }
  }

  onMounted(() => {
    acquire()
    document.addEventListener('visibilitychange', reacquire)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', reacquire)
    sentinel?.release().catch(() => {})
    sentinel = null
  })
}
