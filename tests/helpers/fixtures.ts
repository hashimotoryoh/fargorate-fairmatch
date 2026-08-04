import type {
  FargoRateLookupPlayer,
  FargoRatePlayer,
  GuestPlayer,
} from '../../shared/types/player'

/** テストで共通して使うメンバーシップID（UIでいうFargoRate ID）。桁数に意味はない。 */
export const MEMBERSHIP_ID = '9900001234567'

export function createFargoRateLookupPlayer(
  overrides: Partial<FargoRateLookupPlayer> = {},
): FargoRateLookupPlayer {
  return {
    readableId: '1234567',
    membershipId: MEMBERSHIP_ID,
    firstName: 'Taro',
    lastName: 'Yamada',
    location: 'Tokyo',
    effectiveRating: '523',
    robustness: '412',
    ...overrides,
  }
}

/**
 * `documents` コレクションが返すドキュメント。Markdownの解析結果そのままの形で、
 * `body` は ContentRenderer が受け取れる最小の構造にしてある。
 */
export function createDocument(path: string, title: string) {
  return {
    id: `documents${path}.md`,
    path,
    title,
    description: `${title}の説明。`,
    updatedAt: '2026-07-31',
    body: { type: 'minimal', value: [['p', {}, `${title}の本文。`]] },
  }
}

/**
 * `blog` コレクションが返すブログ記事。Markdownの解析結果そのままの形で、
 * `body` は ContentRenderer が受け取れる最小の構造にしてある。
 */
export function createBlogArticle(
  path: string,
  title: string,
  overrides: {
    date?: string
    updatedAt?: string
    image?: string
  } = {},
) {
  return {
    id: `blog${path}.md`,
    path,
    title,
    description: `${title}の説明。`,
    date: '2026-08-01',
    body: { type: 'minimal', value: [['p', {}, `${title}の本文。`]] },
    ...overrides,
  }
}

/**
 * `faq` コレクションが返すFAQ項目。CSVの1行が1アイテムになるため、IDは
 * 行番号を持つ `<ロケール>/faq.csv#<行番号>` の形にしてある。
 */
export function createFaqItem(
  rowNumber: number,
  question: string,
  answer: string,
  locale = 'ja',
) {
  return {
    id: `${locale}/faq.csv#${rowNumber}`,
    question,
    answer,
  }
}

export function createFargoRatePlayer(
  overrides: Partial<FargoRatePlayer> = {},
): FargoRatePlayer {
  return {
    kind: 'fargorate',
    name: 'Taro Yamada',
    membershipId: MEMBERSHIP_ID,
    readableId: '1234567',
    location: 'Tokyo',
    rating: 523,
    robustness: 412,
    ...overrides,
  }
}

export function createGuestPlayer(
  overrides: Partial<GuestPlayer> = {},
): GuestPlayer {
  return {
    kind: 'guest',
    name: 'Jiro Suzuki',
    rating: 450,
    ...overrides,
  }
}

/**
 * FargoRateレースAPIのレスポンス。`docs/fargorate-races-api.md` に残っている
 * 576対419の実レスポンスを短くしたもので、`closest` は1件だけ true になる。
 */
export function createFargoRateRaces() {
  return [
    { highPlayerRaceTo: 3, lowPlayerRaceTo: 2, delta: 0, closest: false },
    { highPlayerRaceTo: 12, lowPlayerRaceTo: 5, delta: 0, closest: true },
    { highPlayerRaceTo: 13, lowPlayerRaceTo: 6, delta: 0, closest: false },
  ]
}
