import { createError, defineEventHandler, getQuery, readBody } from 'h3'
import { isValidMembershipId } from '../../shared/utils/membershipId'
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
  isValidGuestName,
  isValidGuestRating,
} from '../../shared/utils/guestPlayer'
import {
  PLAYER_QUERY_MAX_LENGTH,
  PLAYER_QUERY_MIN_LENGTH,
  isValidPlayerQuery,
} from '../../shared/utils/playerQuery'
import {
  RATING_MAX,
  RATING_MIN,
  isValidRating,
} from '../../shared/utils/rating'
import { isFargoRatePlayer } from '../../shared/utils/player'
import { readGuestPlayer } from '../../server/utils/guest'

/**
 * `server/` のコードはNitroの自動インポートに依存しており、素のNode環境では
 * それらが未定義になる。テストのためにソースへインポート文を足すのは本末転倒
 * なので、本番と同じ実体をグローバルに載せて解決する。
 *
 * `#imports` のような仮想モジュールを使わないため、ここに載せる名前が
 * `server/` 側で使う自動インポートの一覧そのものになる。
 */
Object.assign(globalThis, {
  createError,
  defineEventHandler,
  // @nuxtjs/sitemap の実体もh3の defineEventHandler そのままの再エクスポート。
  defineSitemapEventHandler: defineEventHandler,
  getQuery,
  readBody,
  isValidMembershipId,
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
  isValidGuestName,
  isValidGuestRating,
  PLAYER_QUERY_MAX_LENGTH,
  PLAYER_QUERY_MIN_LENGTH,
  isValidPlayerQuery,
  RATING_MAX,
  RATING_MIN,
  isValidRating,
  isFargoRatePlayer,
  readGuestPlayer,
  // キャッシュはテストの検証対象ではないため、素通しで実体の関数を呼ばせる。
  defineCachedFunction: (fn: unknown) => fn,
})

/**
 * `server/utils/` 同士は自動インポートで参照し合うため、グローバルへの登録が
 * モジュールの評価より先に必要になる。上の `Object.assign` を済ませてから
 * 動的に読み込み、循環を避ける。
 */
const lookup = await import('../../server/utils/lookup')
const races = await import('../../server/utils/races')

Object.assign(globalThis, {
  lookupPlayerProfile: lookup.lookupPlayerProfile,
  readMembershipId: lookup.readMembershipId,
  readPlayerName: lookup.readPlayerName,
  readPlayerQuery: lookup.readPlayerQuery,
  searchPlayers: lookup.searchPlayers,
  fetchRaces: races.fetchRaces,
  raceOptionsFor: races.raceOptionsFor,
  readRatingParam: races.readRatingParam,
})

const { verifyRecaptchaToken } = await import('../../server/utils/recaptcha')

Object.assign(globalThis, { verifyRecaptchaToken })

/**
 * `useRuntimeConfig` はテスト用の固定値を返す。値そのものに検証したい意味は
 * 無く（実際のGoogleへの問い合わせは `$fetch` 側で差し替える）、未定義による
 * 例外だけを避ければ足りる。
 */
Object.assign(globalThis, {
  useRuntimeConfig: () => ({
    recaptchaSecretKey: 'test-secret',
    public: { recaptchaSiteKey: 'test-site-key' },
  }),
})

/**
 * `$fetch` とセッション系の関数は既定で必ず失敗させる。
 *
 * 素通しにすると外部APIへ実通信したり、セッションの読み書きを検証しないまま
 * 通ってしまったりする。テスト側での `vi.stubGlobal` を強制するため、
 * 呼ばれた時点で落とす。
 */
Object.assign(globalThis, {
  $fetch: () => {
    throw new Error('$fetch は vi.stubGlobal で差し替えること')
  },
  setUserSession: () => {
    throw new Error('setUserSession は vi.stubGlobal で差し替えること')
  },
  getUserSession: () => {
    throw new Error('getUserSession は vi.stubGlobal で差し替えること')
  },
  requireUserSession: () => {
    throw new Error('requireUserSession は vi.stubGlobal で差し替えること')
  },
  queryCollection: () => {
    throw new Error('queryCollection は vi.stubGlobal で差し替えること')
  },
})
