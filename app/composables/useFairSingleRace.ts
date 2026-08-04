/** 得点した側。0が自分、1が対戦相手。 */
export type ScoringSide = 0 | 1

type FairSingleRaceMatch = {
  playerRaceTo: number
  opponentRaceTo: number
  /**
   * 得点の履歴。スコアはこの集計として導く。取り消しを「そのプレイヤーの
   * 最後の1点を取り除く」操作にでき、スコアの遷移の表示と食い違わない。
   */
  history: ScoringSide[]
  startedAt: number
}

const STORAGE_KEY = 'fairrace:match:fair-single-race'

function isMatch(value: unknown): value is FairSingleRaceMatch {
  if (typeof value !== 'object' || value === null) return false
  const match = value as Record<string, unknown>

  return (
    typeof match.playerRaceTo === 'number' &&
    match.playerRaceTo > 0 &&
    typeof match.opponentRaceTo === 'number' &&
    match.opponentRaceTo > 0 &&
    Array.isArray(match.history) &&
    match.history.every((side) => side === 0 || side === 1) &&
    typeof match.startedAt === 'number'
  )
}

function readStoredMatch(): FairSingleRaceMatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isMatch(parsed) ? parsed : null
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、開始からやり直させる。
    return null
  }
}

/**
 * フェアセットマッチの進行状態。リロードや画面の回転で消えないよう
 * sessionStorage に写し、タブを閉じたら破棄させる。
 */
export function useFairSingleRace() {
  const match = useState<FairSingleRaceMatch | null>(
    'fair-single-race-match',
    () => null,
  )
  const hydrated = useState('fair-single-race-hydrated', () => false)

  onMounted(() => {
    if (hydrated.value) return
    match.value = readStoredMatch()
    hydrated.value = true
  })

  function persist() {
    try {
      if (match.value) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(match.value))
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ストレージが使えなくても、タブ内の状態だけで対局は続けられる。
    }
  }

  function start(raceTo: { playerRaceTo: number; opponentRaceTo: number }) {
    match.value = { ...raceTo, history: [], startedAt: Date.now() }
    persist()
  }

  /** 同じセット数のまま次の対局を始める。 */
  function rematch() {
    if (!match.value) return
    match.value = { ...match.value, history: [], startedAt: Date.now() }
    persist()
  }

  function resetMatch() {
    match.value = null
    persist()
  }

  const playerScore = computed(
    () => match.value?.history.filter((side) => side === 0).length ?? 0,
  )
  const opponentScore = computed(
    () => match.value?.history.filter((side) => side === 1).length ?? 0,
  )

  const winner = computed<ScoringSide | null>(() => {
    if (!match.value) return null
    if (playerScore.value >= match.value.playerRaceTo) return 0
    if (opponentScore.value >= match.value.opponentRaceTo) return 1
    return null
  })

  function scoreOf(side: ScoringSide) {
    return side === 0 ? playerScore.value : opponentScore.value
  }

  function raceToOf(side: ScoringSide) {
    if (!match.value) return 0
    return side === 0 ? match.value.playerRaceTo : match.value.opponentRaceTo
  }

  function addPoint(side: ScoringSide) {
    // 決着後の誤タップで結果を動かさない。次の操作は結果ダイアログで受ける。
    if (!match.value || winner.value !== null) return
    if (scoreOf(side) >= raceToOf(side)) return
    match.value = { ...match.value, history: [...match.value.history, side] }
    persist()
  }

  function undoPoint(side: ScoringSide) {
    if (!match.value || winner.value !== null) return
    const index = match.value.history.lastIndexOf(side)
    if (index === -1) return
    const history = [...match.value.history]
    history.splice(index, 1)
    match.value = { ...match.value, history }
    persist()
  }

  /** 開始からの得点の遷移。先頭は必ず 0-0 になる。 */
  const trail = computed(() => {
    const marks = [{ player: 0, opponent: 0 }]
    let player = 0
    let opponent = 0

    for (const side of match.value?.history ?? []) {
      if (side === 0) player += 1
      else opponent += 1
      marks.push({ player, opponent })
    }

    return marks
  })

  return {
    match,
    hydrated,
    start,
    rematch,
    resetMatch,
    addPoint,
    undoPoint,
    playerScore,
    opponentScore,
    winner,
    trail,
  }
}
