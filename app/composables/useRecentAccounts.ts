import type { FargoRatePlayer } from '#shared/types/player'

const STORAGE_KEY = 'fairrace:recentAccounts'
// サジェストとして表示する件数の上限。
const MAX_ENTRIES = 5

/**
 * ゲストは対象外である。リンクのたびにサーバーが引き直すための鍵となる
 * メンバーシップIDを持たず、レーティングも自己申告なので、記憶しても
 * 再現できない。
 */
export type RecentAccount = Pick<
  FargoRatePlayer,
  'membershipId' | 'name' | 'rating'
>

function isRecentAccount(value: unknown): value is RecentAccount {
  if (typeof value !== 'object' || value === null) return false
  const account = value as Record<string, unknown>

  // 旧形式（`fargorateId` キー）の値はここで弾かれ、サジェストから消える。
  // 記憶し直せば復元できるだけの値なので、移行処理は持たない。
  return (
    typeof account.membershipId === 'string' &&
    isValidMembershipId(account.membershipId) &&
    typeof account.name === 'string' &&
    typeof account.rating === 'number'
  )
}

function readStoredAccounts(): RecentAccount[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    // 保存形式が想定より多件数になっていても、表示件数の上限を崩さない。
    return parsed.filter(isRecentAccount).slice(0, MAX_ENTRIES)
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

  function addRecentAccount(profile: RecentAccount) {
    const account: RecentAccount = {
      membershipId: profile.membershipId,
      name: profile.name,
      rating: profile.rating,
    }
    const next = [
      account,
      ...recentAccounts.value.filter(
        (stored) => stored.membershipId !== account.membershipId,
      ),
    ].slice(0, MAX_ENTRIES)
    recentAccounts.value = next
    writeStoredAccounts(next)
  }

  // ユーザーが任意のタイミングでサジェストから個別に消せるようにする。
  function removeRecentAccount(membershipId: string) {
    const next = recentAccounts.value.filter(
      (stored) => stored.membershipId !== membershipId,
    )
    recentAccounts.value = next
    writeStoredAccounts(next)
  }

  // 設定ページの「端末に保存したデータの削除」から呼ぶ。
  function clearRecentAccounts() {
    recentAccounts.value = []
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 消せなくても実害はない。読み込み時に検証されるだけの値のため。
    }
  }

  return {
    recentAccounts,
    addRecentAccount,
    removeRecentAccount,
    clearRecentAccounts,
  }
}
