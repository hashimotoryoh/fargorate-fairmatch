import type {
  CsiMember,
  FargoRatePlayer,
  PlayerProfile,
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

export function createFargoRatePlayer(
  overrides: Partial<FargoRatePlayer> = {},
): FargoRatePlayer {
  return {
    membershipId: FARGORATE_ID,
    firstName: 'Taro',
    lastName: 'Yamada',
    effectiveRating: '523',
    robustness: '412',
    ...overrides,
  }
}

export function createPlayerProfile(
  overrides: Partial<PlayerProfile> = {},
): PlayerProfile {
  return {
    fargorateId: FARGORATE_ID,
    firstName: 'Taro',
    lastName: 'Yamada',
    leagueName: 'Tokyo League',
    region: 'Kanto',
    teamNames: 'Team Alpha',
    effectiveRating: 523,
    robustness: 412,
    ...overrides,
  }
}
