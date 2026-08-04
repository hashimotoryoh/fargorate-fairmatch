import type { FargoRatePlayer, GuestPlayer } from '#shared/types/player'
import type { GameSlug } from '~/utils/games'

/**
 * ゲームの対戦相手。セッションには入らないため、`SessionPlayer` の制約を
 * 受けずユニオンで持てる。判別は `isFargoRatePlayer()` を使う。
 */
export type GameOpponent = FargoRatePlayer | GuestPlayer

type GameSetup = {
  slug: GameSlug | null
  opponent: GameOpponent | null
  /** ブリーフィングに入る前のページ。プレイ完了や中断でここへ戻す。 */
  returnTo: string | null
}

const STORAGE_KEY = 'fairrace:gameSetup'

const EMPTY_SETUP: GameSetup = { slug: null, opponent: null, returnTo: null }

function isGameOpponent(value: unknown): value is GameOpponent {
  if (typeof value !== 'object' || value === null) return false
  const player = value as Record<string, unknown>

  if (player.kind === 'guest') {
    return (
      (player.name === null || typeof player.name === 'string') &&
      typeof player.rating === 'number'
    )
  }

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

function readStoredSetup(): GameSetup {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_SETUP }
    const parsed = JSON.parse(raw) as Record<string, unknown>

    return {
      slug: gameDefinitions.some((game) => game.slug === parsed.slug)
        ? (parsed.slug as GameSlug)
        : null,
      opponent: isGameOpponent(parsed.opponent) ? parsed.opponent : null,
      returnTo: typeof parsed.returnTo === 'string' ? parsed.returnTo : null,
    }
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、選び直させる。
    return { ...EMPTY_SETUP }
  }
}

/**
 * ブリーフィングをまたいで引き回すゲームと対戦相手の選択。リロードや画面の
 * 回転で消えないよう sessionStorage に写し、タブを閉じたら破棄させる。
 * SSR時には読めないため、マウント後に読み込むまで `hydrated` が false になる。
 */
export function useGameSetup() {
  const setup = useState<GameSetup>('game-setup', () => ({ ...EMPTY_SETUP }))
  const hydrated = useState('game-setup-hydrated', () => false)

  onMounted(() => {
    if (hydrated.value) return
    setup.value = readStoredSetup()
    hydrated.value = true
  })

  function persist() {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(setup.value))
    } catch {
      // ストレージが使えなくても、タブ内の状態だけで進行は続けられる。
    }
  }

  /**
   * ゲームを入口にブリーフィングを始める。前回の対戦相手が残っていると
   * ステップ2を飛ばして始まってしまうため、選択を丸ごと作り直す。
   */
  function startWithGame(slug: GameSlug, returnTo: string | null) {
    setup.value = { slug, opponent: null, returnTo }
    persist()
  }

  /** 対戦相手を入口にブリーフィングを始める。ゲームは選ばせ直す。 */
  function startWithOpponent(opponent: GameOpponent, returnTo: string | null) {
    setup.value = { slug: null, opponent, returnTo }
    persist()
  }

  function setGame(slug: GameSlug) {
    setup.value = { ...setup.value, slug }
    persist()
  }

  function setOpponent(opponent: GameOpponent) {
    setup.value = { ...setup.value, opponent }
    persist()
  }

  function clearGameSetup() {
    setup.value = { ...EMPTY_SETUP }
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // 消せなくても実害はない。次の読み込みで検証されるだけの値のため。
    }
  }

  return {
    setup,
    hydrated,
    startWithGame,
    startWithOpponent,
    setGame,
    setOpponent,
    clearGameSetup,
  }
}
