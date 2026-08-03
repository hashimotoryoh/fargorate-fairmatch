// メンバーシップID（UIでは「FargoRate ID」と表記する）は数字だけの文字列。
// かつては13桁の固定長と考えていたが、桁数が一定しないことが判明したため、
// 桁数は検証せず数字だけで構成されていることのみを確かめる。
// 入力フォームとサーバールートの双方で同じ条件を使うため、ここに一本化する。
const MEMBERSHIP_ID_PATTERN = /^\d+$/

export function isValidMembershipId(value: string): boolean {
  return MEMBERSHIP_ID_PATTERN.test(value)
}
