import type { FargoRatePlayer } from '#shared/types/player'

const STORAGE_KEY = 'fairrace:recentOpponents'
/** 一覧として追える範囲に収めつつ、行きつけの相手を拾い切るための件数。 */
const MAX_ENTRIES = 20

/**
 * ゲストは対象外である。次の対戦で引き直すための鍵となるメンバーシップIDを
 * 持たず、レーティングも自己申告なので、記憶しても再現できない。
 */
function isRecentOpponent(value: unknown): value is FargoRatePlayer {
  if (typeof value !== 'object' || value === null) return false
  const player = value as Record<string, unknown>

  return (
    player.kind === 'fargorate' &&
    typeof player.name === 'string' &&
    typeof player.membershipId === 'string' &&
    isValidMembershipId(player.membershipId) &&
    (player.readableId === null || typeof player.readableId === 'string') &&
    (player.location === null || typeof player.location === 'string') &&
    typeof player.rating === 'number' &&
    typeof player.robustness === 'number'
  )
}

function readStoredOpponents(): FargoRatePlayer[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isRecentOpponent).slice(0, MAX_ENTRIES)
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、一覧なしで進める。
    return []
  }
}

function writeStoredOpponents(opponents: FargoRatePlayer[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(opponents))
  } catch {
    // ストレージが使えない環境でも対戦相手の選択自体は続けられる。
  }
}

/**
 * 最近選んだ対戦相手の一覧。プレイヤーを丸ごと保存しておき、選択時に
 * ルックアップを経ずに対戦相手を復元する（レーティングはゲーム設定で
 * 引き直すため、古くても問題ない）。サーバーへは送らず、端末のlocalStorageに
 * 保存する。SSR時にはlocalStorageが無いため、マウント後に読み込む。
 */
export function useRecentOpponents() {
  const recentOpponents = useState<FargoRatePlayer[]>(
    'recent-opponents',
    () => [],
  )
  const hydrated = useState('recent-opponents-hydrated', () => false)

  onMounted(() => {
    if (hydrated.value) return
    recentOpponents.value = readStoredOpponents()
    hydrated.value = true
  })

  function addRecentOpponent(opponent: FargoRatePlayer) {
    const next = [
      opponent,
      ...recentOpponents.value.filter(
        (stored) => stored.membershipId !== opponent.membershipId,
      ),
    ].slice(0, MAX_ENTRIES)
    recentOpponents.value = next
    writeStoredOpponents(next)
  }

  function removeRecentOpponent(membershipId: string) {
    const next = recentOpponents.value.filter(
      (stored) => stored.membershipId !== membershipId,
    )
    recentOpponents.value = next
    writeStoredOpponents(next)
  }

  function clearRecentOpponents() {
    recentOpponents.value = []
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // 消せなくても実害はない。読み込み時に検証されるだけの値のため。
    }
  }

  return {
    recentOpponents,
    addRecentOpponent,
    removeRecentOpponent,
    clearRecentOpponents,
  }
}
