/**
 * 言語切り替えの選択肢。`nuxt.config.ts` の `i18n.locales` から作る。
 * 言語を増やす作業を設定と翻訳ファイルの追加だけで完結させるため、
 * 選択肢を書き並べる箇所を複数に増やさずここへ一本化する。
 */
export function useLocaleOptions() {
  const { locales } = useI18n()

  // `flag` は `LocaleObject` のカスタムプロパティで型が `unknown` のため、
  // ここで文字列に絞ってから返す。
  return computed(() =>
    locales.value.map((item) => ({
      code: item.code,
      name: item.name ?? item.code,
      flag: typeof item.flag === 'string' ? item.flag : '',
    })),
  )
}
