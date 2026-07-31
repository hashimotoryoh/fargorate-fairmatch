import { createError, defineEventHandler, readBody } from 'h3'
import { isValidFargorateId } from '../../shared/utils/fargorateId'
import { lookupPlayerProfile, readFargorateId } from '../../server/utils/lookup'

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
  lookupPlayerProfile,
  readFargorateId,
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
