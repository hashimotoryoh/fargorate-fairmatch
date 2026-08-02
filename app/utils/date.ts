/**
 * フロントマターのISO形式の日付（`'YYYY-MM-DD'`）を、指定した言語の表記に直す。
 *
 * タイムゾーンを指定しないと、UTCの0時が前日として表示される環境がある。
 */
export function formatLocaleDate(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(new Date(value))
}
