import type {
  CsiMember,
  FargoRateLookupPlayer,
  FargoRatePlayer,
  GuestPlayer,
} from '../../shared/types/player'

/** テストで共通して使うFargoRate ID。13桁であること以外に意味はない。 */
export const FARGORATE_ID = '9900001234567'

export function createCsiMember(overrides: Partial<CsiMember> = {}): CsiMember {
  return {
    MembershipNumber: FARGORATE_ID,
    FirstName: 'Taro',
    LastName: 'Yamada',
    LeagueName: 'Tokyo League',
    Region: 'Kanto',
    TeamNames: 'Team Alpha',
    ...overrides,
  }
}

export function createFargoRateLookupPlayer(
  overrides: Partial<FargoRateLookupPlayer> = {},
): FargoRateLookupPlayer {
  return {
    membershipId: FARGORATE_ID,
    firstName: 'Taro',
    lastName: 'Yamada',
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
    fargorateId: FARGORATE_ID,
    leagueName: 'Tokyo League',
    region: 'Kanto',
    teamNames: 'Team Alpha',
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
