// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['**/*.d.ts'],
  rules: {
    // モジュール拡張で既存のインターフェースへ型を合成するため、
    // 単一の extends のみを持つ空のインターフェース宣言を許可する。
    '@typescript-eslint/no-empty-object-type': [
      'error',
      { allowInterfaces: 'with-single-extends' },
    ],
  },
})
