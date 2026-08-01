/**
 * テスト環境のブラウザの言語を日本語に固定する。
 *
 * happy-dom の `navigator.language` は英語であり、@nuxtjs/i18n の
 * `detectBrowserLanguage` はそれを見て英語ロケールへ倒す。テストごとに
 * どちらの言語で描画されるかが変わると、UIの検証が言語検出の挙動に
 * 引きずられる。既定のロケールで走らせ、英語での描画は明示的に切り替えて
 * 確かめる。
 */
Object.defineProperty(navigator, 'language', {
  value: 'ja',
  configurable: true,
})

Object.defineProperty(navigator, 'languages', {
  value: ['ja', 'ja-JP'],
  configurable: true,
})
