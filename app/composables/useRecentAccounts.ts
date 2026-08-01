import type { PlayerProfile } from '#shared/types/player'

const STORAGE_KEY = 'fairmatch:recentAccounts'
// サジェストとして表示する件数の上限。
const MAX_ENTRIES = 5

export type RecentAccount = Pick<
  PlayerProfile,
  'fargorateId' | 'firstName' | 'lastName' | 'effectiveRating'
>

function isRecentAccount(value: unknown): value is RecentAccount {
  if (typeof value !== 'object' || value === null) return false
  const account = value as Record<string, unknown>

  return (
    typeof account.fargorateId === 'string' &&
    isValidFargorateId(account.fargorateId) &&
    typeof account.firstName === 'string' &&
    typeof account.lastName === 'string' &&
    typeof account.effectiveRating === 'number'
  )
}

function readStoredAccounts(): RecentAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecentAccount)
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、サジェストなしで進める。
    return []
  }
}

function writeStoredAccounts(accounts: RecentAccount[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
  } catch {
    // ストレージが使えない環境でも入力自体は続けられるため、失敗は無視する。
  }
}

/**
 * ルックアップページで、過去に本人確認まで済ませたアカウントをサジェストする
 * ための一覧。名前とレーティングだけを表示に使い、生のFargoRate IDはサジェスト
 * 上には出さない。サーバーへは送らず、端末のlocalStorageに保存する。
 * SSR時にはlocalStorageが無いため、マウント後に読み込む。
 */
export function useRecentAccounts() {
  const recentAccounts = ref<RecentAccount[]>([])

  onMounted(() => {
    recentAccounts.value = readStoredAccounts()
  })

  function addRecentAccount(profile: PlayerProfile) {
    const account: RecentAccount = {
      fargorateId: profile.fargorateId,
      firstName: profile.firstName,
      lastName: profile.lastName,
      effectiveRating: profile.effectiveRating,
    }
    const next = [
      account,
      ...recentAccounts.value.filter(
        (stored) => stored.fargorateId !== account.fargorateId,
      ),
    ].slice(0, MAX_ENTRIES)
    recentAccounts.value = next
    writeStoredAccounts(next)
  }

  // ユーザーが任意のタイミングでサジェストから個別に消せるようにする。
  function removeRecentAccount(fargorateId: string) {
    const next = recentAccounts.value.filter(
      (stored) => stored.fargorateId !== fargorateId,
    )
    recentAccounts.value = next
    writeStoredAccounts(next)
  }

  return { recentAccounts, addRecentAccount, removeRecentAccount }
}
