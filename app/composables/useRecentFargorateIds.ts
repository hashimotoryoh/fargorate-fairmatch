const STORAGE_KEY = 'fairmatch:recentFargorateIds'
// サジェストとして表示する件数の上限。
const MAX_ENTRIES = 5

function readStoredIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (id): id is string => typeof id === 'string' && isValidFargorateId(id),
    )
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、サジェストなしで進める。
    return []
  }
}

function writeStoredIds(ids: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {
    // ストレージが使えない環境でも入力自体は続けられるため、失敗は無視する。
  }
}

/**
 * ルックアップページで、過去に本人確認まで済ませたFargoRate IDを
 * サジェストするための一覧。サーバーへは送らず、端末のlocalStorageに保存する。
 * SSR時にはlocalStorageが無いため、マウント後に読み込む。
 */
export function useRecentFargorateIds() {
  const recentIds = ref<string[]>([])

  onMounted(() => {
    recentIds.value = readStoredIds()
  })

  function addRecentId(id: string) {
    const next = [
      id,
      ...recentIds.value.filter((stored) => stored !== id),
    ].slice(0, MAX_ENTRIES)
    recentIds.value = next
    writeStoredIds(next)
  }

  return { recentIds, addRecentId }
}
