import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * 既定のロケールのメッセージ。
 *
 * `i18n/locales/*.json` は @intlify/unplugin-vue-i18n がビルド時にメッセージ
 * 関数へコンパイルするため、`import` すると素の文字列が得られない。
 * テストからは実体のJSONをそのまま読む。
 *
 * `nuxt` プロジェクトでは `import.meta.url` がファイルURLにならないため、
 * Vitestの起動位置であるリポジトリのルートからの相対で解決する。
 */
const ja: unknown = JSON.parse(
  readFileSync(join(process.cwd(), 'i18n/locales/ja.json'), 'utf8'),
)

/**
 * 日本語のメッセージをキーで引く。
 *
 * テストで表示文言をベタ書きすると翻訳ファイルとの二重管理になり、キーの
 * 綴り間違いも検出できない。既定のロケールのメッセージを実体から引くことで、
 * 文面の改訂ではテストが落ちず、キーの取り違えでは落ちる状態を作る。
 *
 * `params` を渡すと、vue-i18n の名前付きプレースホルダ（`{name}` など）を
 * 単純な文字列置換で埋める。
 */
export function jaMessage(
  key: string,
  params?: Record<string, string>,
): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (current, segment) => (current as Record<string, unknown>)?.[segment],
      ja,
    )

  if (typeof value !== 'string') {
    throw new Error(`ja.json にメッセージがない: ${key}`)
  }

  if (!params) return value

  return Object.entries(params).reduce(
    (message, [name, replacement]) =>
      message.replaceAll(`{${name}}`, replacement),
    value,
  )
}
