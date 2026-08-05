import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('../../../nuxt.config.ts', import.meta.url)),
  'utf8',
)

/**
 * セッションクッキーの `Secure` 属性は、実機確認（`npm run dev:host`）が
 * 平文HTTPになるため、開発環境に限って外してある。この上書きが `$development`
 * の外（ベースの `runtimeConfig`）へ移ると、本番のセッションクッキーが
 * 平文HTTPでも送られるようになるが、画面上は正常に見えたまま保護だけが
 * 消える。緩めた場合にテストが落ちる形で固定する。
 */
describe('セッションクッキーの secure の上書き', () => {
  it('secure: false は1か所にしか書かれていない', () => {
    expect(source.match(/secure:\s*false/g)).toHaveLength(1)
  })

  it('その1か所は $development の runtimeConfig の中にある', () => {
    // 構造のトークンの間には空白とラインコメントだけを許す。`[\s\S]*?` で
    // 緩めると別のブロックをまたいでも一致してしまい、内側にあることを
    // 保証できない。
    expect(source).toMatch(
      /\$development:\s*\{(?:\s|\/\/[^\n]*)*runtimeConfig:\s*\{(?:\s|\/\/[^\n]*)*session:\s*\{(?:\s|\/\/[^\n]*)*cookie:\s*\{\s*secure:\s*false\s*\}/,
    )
  })
})
