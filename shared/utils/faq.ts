/**
 * `faq` コレクションのアイテムのID（例: `ja/faq.csv#12`）から行番号を取り出す。
 *
 * CSVの行順＝表示したい順として扱うが、`queryCollection(...).all()` は
 * 明示的な `order()` を指定しない限り並び順を保証しない。IDを文字列のまま
 * ソートすると `#10` が `#2` より前に来てしまう（辞書順の罠）ため、必ず
 * 数値に変換してから比較する。
 */
export function faqRowNumber(id: string): number {
  return Number(id.split('#').at(-1))
}

/** FAQの項目をCSVの行順（行番号の昇順）に並べ替える。 */
export function sortFaqItemsByRow<T extends { id: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => faqRowNumber(a.id) - faqRowNumber(b.id))
}
