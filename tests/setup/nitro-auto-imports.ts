import { createError, defineEventHandler, readBody } from 'h3'
import { isValidFargorateId } from '../../shared/utils/fargorateId'
import {
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
  isValidGuestName,
  isValidGuestRating,
} from '../../shared/utils/guestPlayer'
import { readGuestPlayer } from '../../server/utils/guest'
import { lookupPlayerProfile, readFargorateId } from '../../server/utils/lookup'
import { verifyRecaptchaToken } from '../../server/utils/recaptcha'

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
  readBody,
  isValidFargorateId,
  GUEST_NAME_MAX_LENGTH,
  GUEST_RATING_MAX,
  GUEST_RATING_MIN,
  isValidGuestName,
  isValidGuestRating,
  lookupPlayerProfile,
  readFargorateId,
  readGuestPlayer,
  verifyRecaptchaToken,
})

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
 * `$fetch` と `setUserSession` は既定で必ず失敗させる。
 *
 * 前者を素通しにすると外部APIへ実通信してしまい、後者を素通しにすると
 * セッションの書き込みを検証しないまま通ってしまう。テスト側での
 * `vi.stubGlobal` を強制するため、呼ばれた時点で落とす。
 */
Object.assign(globalThis, {
  $fetch: () => {
    throw new Error('$fetch は vi.stubGlobal で差し替えること')
  },
  setUserSession: () => {
    throw new Error('setUserSession は vi.stubGlobal で差し替えること')
  },
})
