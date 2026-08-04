import type { FargoRateSearchResult } from '#shared/types/player'

/**
 * FargoRateのプレイヤー検索。`/lookup` とゲームの対戦プレイヤー選択で共有する。
 *
 * 認証済みなら `POST /api/players/lookup` は reCAPTCHA を要求しないため、
 * トークンの取得もスクリプトの読み込みも省く。
 */
export function usePlayerSearch() {
  const { t } = useI18n()
  const { loggedIn } = useUserSession()
  const { execute: executeRecaptcha } = useRecaptcha()

  const query = ref('')
  // 検索前と0件を区別するため、初期値は空配列ではなく null にする。
  const players = ref<FargoRateSearchResult[] | null>(null)
  const pending = ref(false)
  const errorMessage = ref('')

  const invalidQueryMessage = computed(() =>
    t('lookup.errors.invalidQuery', {
      min: PLAYER_QUERY_MIN_LENGTH,
      max: PLAYER_QUERY_MAX_LENGTH,
    }),
  )

  // サーバールートは英語のstatusMessageしか返さないため、表示する文言は
  // ステータスコードからこちらで組み立てる。
  function toErrorMessage(error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode

    if (statusCode === 400) {
      return invalidQueryMessage.value
    }
    if (statusCode === 422) {
      return t('lookup.errors.recaptchaFailed')
    }
    return t('lookup.errors.unexpected')
  }

  /**
   * 検索語を1回だけ引く。ゲーム設定でのレーティングの引き直しのような、
   * 画面の検索状態を持たない用途向け。
   */
  async function fetchPlayers(
    searchQuery: string,
  ): Promise<FargoRateSearchResult[]> {
    const recaptchaToken = loggedIn.value
      ? undefined
      : await executeRecaptcha('playerLookup')

    return await $fetch<FargoRateSearchResult[]>('/api/players/lookup', {
      method: 'POST',
      body: { query: searchQuery, recaptchaToken },
    })
  }

  async function search() {
    // 前回の結果を残したままエラーを出すと、どちらの検索の結果か読めなくなる。
    // 入力を弾くときも、通信に失敗したときも同じように消す。
    players.value = null

    if (!isValidPlayerQuery(query.value)) {
      errorMessage.value = invalidQueryMessage.value
      return
    }

    pending.value = true
    errorMessage.value = ''

    try {
      players.value = await fetchPlayers(query.value)
    } catch (error) {
      errorMessage.value = toErrorMessage(error)
    } finally {
      pending.value = false
    }
  }

  return { query, players, pending, errorMessage, search, fetchPlayers }
}
