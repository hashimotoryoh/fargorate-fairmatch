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
}

const STORAGE_KEY = 'fairrace:gameSetup'

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
  const empty: GameSetup = { slug: null, opponent: null }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Record<string, unknown>

    return {
      slug: gameDefinitions.some((game) => game.slug === parsed.slug)
        ? (parsed.slug as GameSlug)
        : null,
      opponent: isGameOpponent(parsed.opponent) ? parsed.opponent : null,
    }
  } catch {
    // 壊れた値やプライベートブラウジングでの例外は無視し、選び直させる。
    return empty
  }
}

/**
 * ブリーフィングをまたいで引き回すゲームと対戦相手の選択。リロードや画面の
 * 回転で消えないよう sessionStorage に写し、タブを閉じたら破棄させる。
 * SSR時には読めないため、マウント後に読み込むまで `hydrated` が false になる。
 */
export function useGameSetup() {
  const setup = useState<GameSetup>('game-setup', () => ({
    slug: null,
    opponent: null,
  }))
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

  function setGame(slug: GameSlug) {
    setup.value = { ...setup.value, slug }
    persist()
  }

  function setOpponent(opponent: GameOpponent) {
    setup.value = { ...setup.value, opponent }
    persist()
  }

  function clearGameSetup() {
    setup.value = { slug: null, opponent: null }
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // 消せなくても実害はない。次の読み込みで検証されるだけの値のため。
    }
  }

  return { setup, hydrated, setGame, setOpponent, clearGameSetup }
}
