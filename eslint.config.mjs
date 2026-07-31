// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // AIコーディングエージェントが作業用のgit worktreeを掘る場所であり、
    // リポジトリのソースではない。中身は別チェックアウトの複製なので、
    // 走査すると同じファイルを二重に検査したうえ .nuxt の解決にも失敗する。
    ignores: ['.claude/**'],
  },
  {
    files: ['**/*.d.ts'],
    rules: {
      // モジュール拡張で既存のインターフェースへ型を合成するため、
      // 単一の extends のみを持つ空のインターフェース宣言を許可する。
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      // Prettier が void 要素を自己終了形式に整形するため、どちらの形式も許可する。
      'vue/html-self-closing': ['warn', { html: { void: 'any' } }],
    },
  },
)
