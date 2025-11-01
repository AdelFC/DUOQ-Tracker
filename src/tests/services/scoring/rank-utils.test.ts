/**
 * Tests pour les utilitaires de rank
 */

import { describe, it, expect } from 'vitest'
import {
  rankToValue,
  valueToRank,
  parseRankString,
  formatRankString,
} from '../../../services/scoring/rank-utils.js'

describe('rankToValue', () => {
  it('should convert IRON IV to 0', () => {
    expect(rankToValue({ tier: 'IRON', division: 'IV', lp: 0 })).toBe(0)
  })

  it('should convert IRON I to 3', () => {
    expect(rankToValue({ tier: 'IRON', division: 'I', lp: 0 })).toBe(3)
  })

  it('should convert BRONZE IV to 4', () => {
    expect(rankToValue({ tier: 'BRONZE', division: 'IV', lp: 0 })).toBe(4)
  })

  it('should convert GOLD IV to 12', () => {
    expect(rankToValue({ tier: 'GOLD', division: 'IV', lp: 0 })).toBe(12)
  })

  it('should convert GOLD II to 14', () => {
    expect(rankToValue({ tier: 'GOLD', division: 'II', lp: 0 })).toBe(14)
  })

  it('should convert PLATINUM I to 19', () => {
    expect(rankToValue({ tier: 'PLATINUM', division: 'I', lp: 0 })).toBe(19)
  })

  it('should convert DIAMOND IV to 24', () => {
    expect(rankToValue({ tier: 'DIAMOND', division: 'IV', lp: 0 })).toBe(24)
  })

  it('should convert MASTER (no division) to 28', () => {
    expect(rankToValue({ tier: 'MASTER', division: null, lp: 0 })).toBe(28)
  })

  it('should convert GRANDMASTER to 32', () => {
    expect(rankToValue({ tier: 'GRANDMASTER', division: null, lp: 0 })).toBe(32)
  })

  it('should convert CHALLENGER to 36', () => {
    expect(rankToValue({ tier: 'CHALLENGER', division: null, lp: 0 })).toBe(36)
  })
})

describe('valueToRank', () => {
  it('should convert 0 to IRON IV', () => {
    const rank = valueToRank(0)
    expect(rank.tier).toBe('IRON')
    expect(rank.division).toBe('IV')
  })

  it('should convert 3 to IRON I', () => {
    const rank = valueToRank(3)
    expect(rank.tier).toBe('IRON')
    expect(rank.division).toBe('I')
  })

  it('should convert 12 to GOLD IV', () => {
    const rank = valueToRank(12)
    expect(rank.tier).toBe('GOLD')
    expect(rank.division).toBe('IV')
  })

  it('should convert 14 to GOLD II', () => {
    const rank = valueToRank(14)
    expect(rank.tier).toBe('GOLD')
    expect(rank.division).toBe('II')
  })

  it('should convert 28 to MASTER (no division)', () => {
    const rank = valueToRank(28)
    expect(rank.tier).toBe('MASTER')
    expect(rank.division).toBeNull()
  })

  it('should convert 36 to CHALLENGER', () => {
    const rank = valueToRank(36)
    expect(rank.tier).toBe('CHALLENGER')
    expect(rank.division).toBeNull()
  })

  it('should clamp negative values to IRON IV', () => {
    const rank = valueToRank(-5)
    expect(rank.tier).toBe('IRON')
    expect(rank.division).toBe('IV')
  })

  it('should clamp values > 36 to CHALLENGER', () => {
    const rank = valueToRank(50)
    expect(rank.tier).toBe('CHALLENGER')
  })
})

describe('Round-trip conversion', () => {
  const testRanks = [
    { tier: 'IRON', division: 'IV' },
    { tier: 'BRONZE', division: 'III' },
    { tier: 'SILVER', division: 'II' },
    { tier: 'GOLD', division: 'I' },
    { tier: 'PLATINUM', division: 'IV' },
    { tier: 'EMERALD', division: 'II' },
    { tier: 'DIAMOND', division: 'I' },
    { tier: 'MASTER', division: null },
    { tier: 'GRANDMASTER', division: null },
    { tier: 'CHALLENGER', division: null },
  ]

  testRanks.forEach(({ tier, division }) => {
    it(`should round-trip ${tier} ${division || ''}`, () => {
      const original = { tier: tier as any, division: division as any, lp: 0 }
      const value = rankToValue(original)
      const converted = valueToRank(value)

      expect(converted.tier).toBe(tier)
      expect(converted.division).toBe(division)
    })
  })
})

describe('parseRankString', () => {
  it('should parse "G4" to GOLD IV', () => {
    const rank = parseRankString('G4')
    expect(rank.tier).toBe('GOLD')
    expect(rank.division).toBe('IV')
  })

  it('should parse "G2" to GOLD II', () => {
    const rank = parseRankString('G2')
    expect(rank.tier).toBe('GOLD')
    expect(rank.division).toBe('II')
  })

  it('should parse "P4" to PLATINUM IV', () => {
    const rank = parseRankString('P4')
    expect(rank.tier).toBe('PLATINUM')
    expect(rank.division).toBe('IV')
  })

  it('should parse "D1" to DIAMOND I', () => {
    const rank = parseRankString('D1')
    expect(rank.tier).toBe('DIAMOND')
    expect(rank.division).toBe('I')
  })

  it('should parse "B3" to BRONZE III', () => {
    const rank = parseRankString('B3')
    expect(rank.tier).toBe('BRONZE')
    expect(rank.division).toBe('III')
  })

  it('should parse "M" to MASTER', () => {
    const rank = parseRankString('M')
    expect(rank.tier).toBe('MASTER')
    expect(rank.division).toBeNull()
  })

  it('should parse "GM" to GRANDMASTER', () => {
    const rank = parseRankString('GM')
    expect(rank.tier).toBe('GRANDMASTER')
    expect(rank.division).toBeNull()
  })

  it('should parse "C" to CHALLENGER', () => {
    const rank = parseRankString('C')
    expect(rank.tier).toBe('CHALLENGER')
    expect(rank.division).toBeNull()
  })

  it('should parse "E2" to EMERALD II', () => {
    const rank = parseRankString('E2')
    expect(rank.tier).toBe('EMERALD')
    expect(rank.division).toBe('II')
  })
})

describe('formatRankString', () => {
  it('should format GOLD IV to "G4"', () => {
    expect(formatRankString({ tier: 'GOLD', division: 'IV', lp: 0 })).toBe('G4')
  })

  it('should format GOLD II to "G2"', () => {
    expect(formatRankString({ tier: 'GOLD', division: 'II', lp: 0 })).toBe('G2')
  })

  it('should format PLATINUM IV to "P4"', () => {
    expect(formatRankString({ tier: 'PLATINUM', division: 'IV', lp: 0 })).toBe('P4')
  })

  it('should format DIAMOND I to "D1"', () => {
    expect(formatRankString({ tier: 'DIAMOND', division: 'I', lp: 0 })).toBe('D1')
  })

  it('should format MASTER to "M"', () => {
    expect(formatRankString({ tier: 'MASTER', division: null, lp: 0 })).toBe('M')
  })

  it('should format GRANDMASTER to "GM"', () => {
    expect(formatRankString({ tier: 'GRANDMASTER', division: null, lp: 0 })).toBe('GM')
  })

  it('should format CHALLENGER to "C"', () => {
    expect(formatRankString({ tier: 'CHALLENGER', division: null, lp: 0 })).toBe('C')
  })
})

describe('String round-trip', () => {
  const testStrings = ['I4', 'B3', 'S2', 'G1', 'P4', 'E3', 'D2', 'M', 'GM', 'C']

  testStrings.forEach((str) => {
    it(`should round-trip "${str}"`, () => {
      const rank = parseRankString(str)
      const formatted = formatRankString(rank)
      expect(formatted).toBe(str)
    })
  })
})
