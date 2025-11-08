/**
 * Tests pour les bonus spéciaux
 * Formules (SPECIFICATIONS.md v2.1 - Section 6):
 *
 * Bonus Duo "No Death":
 * - Condition: Les 2 joueurs du duo ont 0 death
 * - Bonus: +20 points au duo
 *
 * Bonus Individuels:
 * - Pentakill: +30 pts
 * - Quadrakill: +15 pts
 * - Triple kill: +5 pts
 * - First Blood: +5 pts
 * - Killing Spree (7+ kills sans mourir): +10 pts
 */

import { describe, it, expect } from 'vitest'
import { calculateNoDeathBonus, calculatePlayerSpecialBonus } from '../../../services/scoring/bonuses.js'
import type { PlayerGameStats } from '../../../types/game.js'

describe('calculateNoDeathBonus', () => {
  describe('Both players with 0 deaths', () => {
    it('should give +20 points when both have 0 deaths', () => {
      const bonus = calculateNoDeathBonus(0, 0)
      expect(bonus).toBe(20)
    })
  })

  describe('One or both players with deaths', () => {
    it('should give 0 points when noob has 1 death', () => {
      const bonus = calculateNoDeathBonus(1, 0)
      expect(bonus).toBe(0)
    })

    it('should give 0 points when carry has 1 death', () => {
      const bonus = calculateNoDeathBonus(0, 1)
      expect(bonus).toBe(0)
    })

    it('should give 0 points when both have deaths', () => {
      const bonus = calculateNoDeathBonus(3, 5)
      expect(bonus).toBe(0)
    })

    it('should give 0 points when noob has many deaths', () => {
      const bonus = calculateNoDeathBonus(10, 0)
      expect(bonus).toBe(0)
    })

    it('should give 0 points when carry has many deaths', () => {
      const bonus = calculateNoDeathBonus(0, 15)
      expect(bonus).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle negative deaths (théoriquement impossible)', () => {
      // Validation de robustesse uniquement
      const bonus = calculateNoDeathBonus(-1, 0)
      expect(bonus).toBe(0) // Traité comme "a des deaths"
    })

    it('should handle very high death counts', () => {
      const bonus = calculateNoDeathBonus(0, 100)
      expect(bonus).toBe(0)
    })

    it('should strictly require BOTH to have 0 deaths', () => {
      // Noob: 0, Carry: 0 → +20
      expect(calculateNoDeathBonus(0, 0)).toBe(20)

      // Noob: 1, Carry: 0 → 0
      expect(calculateNoDeathBonus(1, 0)).toBe(0)

      // Noob: 0, Carry: 1 → 0
      expect(calculateNoDeathBonus(0, 1)).toBe(0)

      // Noob: 1, Carry: 1 → 0
      expect(calculateNoDeathBonus(1, 1)).toBe(0)
    })
  })

  describe('Spec examples', () => {
    it('perfect duo (15/0/20 and 12/0/15) should get +20', () => {
      const noobDeaths = 0
      const carryDeaths = 0

      const bonus = calculateNoDeathBonus(noobDeaths, carryDeaths)
      expect(bonus).toBe(20)
    })

    it('duo with carry death (10/0/15 and 8/1/10) should get 0', () => {
      const noobDeaths = 0
      const carryDeaths = 1

      const bonus = calculateNoDeathBonus(noobDeaths, carryDeaths)
      expect(bonus).toBe(0)
    })
  })
})

describe('calculatePlayerSpecialBonus', () => {
  // Helper pour créer des stats minimales
  const createBaseStats = (): PlayerGameStats => ({
    puuid: 'test-puuid',
    summonerId: 'test-summoner',
    teamId: 100,
    championId: 1,
    championName: 'TestChamp',
    lane: 'MIDDLE',
    kills: 0,
    deaths: 0,
    assists: 0,
    previousRank: { tier: 'GOLD', division: 'IV', lp: 0 },
    newRank: { tier: 'GOLD', division: 'IV', lp: 50 },
    peakElo: 'G4',
    isOffRole: false,
    isOffChampion: false,
  })

  describe('Pentakill bonus', () => {
    it('should give +30 pts for 1 pentakill', () => {
      const stats = { ...createBaseStats(), pentaKills: 1 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30)
    })

    it('should give +60 pts for 2 pentakills', () => {
      const stats = { ...createBaseStats(), pentaKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(60)
    })

    it('should give +90 pts for 3 pentakills', () => {
      const stats = { ...createBaseStats(), pentaKills: 3 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(90)
    })

    it('should give 0 pts when pentaKills is 0', () => {
      const stats = { ...createBaseStats(), pentaKills: 0 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts when pentaKills is undefined', () => {
      const stats = createBaseStats() // pas de pentaKills
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })
  })

  describe('Quadrakill bonus', () => {
    it('should give +15 pts for 1 quadrakill', () => {
      const stats = { ...createBaseStats(), quadraKills: 1 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(15)
    })

    it('should give +30 pts for 2 quadrakills', () => {
      const stats = { ...createBaseStats(), quadraKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30)
    })

    it('should NOT count quadra if pentakill exists', () => {
      const stats = { ...createBaseStats(), pentaKills: 1, quadraKills: 1 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30) // Penta seulement (+30), pas de quadra
    })

    it('should give 0 pts when quadraKills is 0', () => {
      const stats = { ...createBaseStats(), quadraKills: 0 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts when quadraKills is undefined', () => {
      const stats = createBaseStats()
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })
  })

  describe('Triple kill bonus', () => {
    it('should give +5 pts for 1 triple kill', () => {
      const stats = { ...createBaseStats(), tripleKills: 1 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(5)
    })

    it('should give +10 pts for 2 triple kills', () => {
      const stats = { ...createBaseStats(), tripleKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(10)
    })

    it('should NOT count triple if pentakill exists', () => {
      const stats = { ...createBaseStats(), pentaKills: 1, tripleKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30) // Penta seulement
    })

    it('should NOT count triple if quadrakill exists', () => {
      const stats = { ...createBaseStats(), quadraKills: 1, tripleKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(15) // Quadra seulement
    })

    it('should NOT count triple if both penta and quadra exist', () => {
      const stats = { ...createBaseStats(), pentaKills: 1, quadraKills: 1, tripleKills: 2 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30) // Penta seulement (prioritaire)
    })

    it('should give 0 pts when tripleKills is 0', () => {
      const stats = { ...createBaseStats(), tripleKills: 0 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts when tripleKills is undefined', () => {
      const stats = createBaseStats()
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })
  })

  describe('First Blood bonus', () => {
    it('should give +5 pts for first blood', () => {
      const stats = { ...createBaseStats(), firstBloodKill: true }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(5)
    })

    it('should give 0 pts when firstBloodKill is false', () => {
      const stats = { ...createBaseStats(), firstBloodKill: false }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts when firstBloodKill is undefined', () => {
      const stats = createBaseStats()
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should stack with multikill bonuses', () => {
      const stats = { ...createBaseStats(), pentaKills: 1, firstBloodKill: true }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(35) // 30 (penta) + 5 (FB)
    })
  })

  describe('Killing Spree bonus', () => {
    it('should give +10 pts for 7 kills spree (threshold)', () => {
      const stats = { ...createBaseStats(), largestKillingSpree: 7 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(10)
    })

    it('should give +10 pts for 10 kills spree', () => {
      const stats = { ...createBaseStats(), largestKillingSpree: 10 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(10)
    })

    it('should give +10 pts for 20 kills spree', () => {
      const stats = { ...createBaseStats(), largestKillingSpree: 20 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(10)
    })

    it('should give 0 pts for 6 kills spree (sous le seuil)', () => {
      const stats = { ...createBaseStats(), largestKillingSpree: 6 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts for 0 kills spree', () => {
      const stats = { ...createBaseStats(), largestKillingSpree: 0 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should give 0 pts when largestKillingSpree is undefined', () => {
      const stats = createBaseStats()
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should stack with multikill bonuses', () => {
      const stats = { ...createBaseStats(), pentaKills: 1, largestKillingSpree: 10 }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(40) // 30 (penta) + 10 (KS)
    })
  })

  describe('Combined bonuses', () => {
    it('penta + first blood + killing spree = 45 pts', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 10,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(45) // 30 + 5 + 10
    })

    it('quadra + first blood + killing spree = 30 pts', () => {
      const stats = {
        ...createBaseStats(),
        quadraKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 7,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(30) // 15 + 5 + 10
    })

    it('triple + first blood + killing spree = 20 pts', () => {
      const stats = {
        ...createBaseStats(),
        tripleKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 8,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(20) // 5 + 5 + 10
    })

    it('first blood + killing spree (sans multikill) = 15 pts', () => {
      const stats = {
        ...createBaseStats(),
        firstBloodKill: true,
        largestKillingSpree: 9,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(15) // 5 + 10
    })

    it('penta + quadra + triple (seul penta compte) + FB + KS = 45 pts', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: 1,
        quadraKills: 1,
        tripleKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 12,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(45) // 30 (penta prioritaire) + 5 (FB) + 10 (KS)
    })

    it('2 pentas + first blood + killing spree = 75 pts', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: 2,
        firstBloodKill: true,
        largestKillingSpree: 15,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(75) // 60 + 5 + 10
    })
  })

  describe('Backward compatibility', () => {
    it('should handle stats with no multikill fields at all', () => {
      const stats = createBaseStats() // Pas de multikills
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should handle partially defined multikill fields', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: undefined,
        quadraKills: 1,
        tripleKills: undefined,
        firstBloodKill: true,
        largestKillingSpree: undefined,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(20) // 15 (quadra) + 5 (FB)
    })

    it('should not crash with all fields undefined', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: undefined,
        quadraKills: undefined,
        tripleKills: undefined,
        firstBloodKill: undefined,
        largestKillingSpree: undefined,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero for all multikill fields', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: 0,
        quadraKills: 0,
        tripleKills: 0,
        firstBloodKill: false,
        largestKillingSpree: 0,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })

    it('should handle very high multikill counts', () => {
      const stats = {
        ...createBaseStats(),
        pentaKills: 5,
        firstBloodKill: true,
        largestKillingSpree: 30,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(165) // 150 (5 pentas) + 5 (FB) + 10 (KS)
    })

    it('should give killing spree only if >= 7', () => {
      // 6 kills: 0 pts
      expect(calculatePlayerSpecialBonus({ ...createBaseStats(), largestKillingSpree: 6 })).toBe(0)

      // 7 kills: +10 pts
      expect(calculatePlayerSpecialBonus({ ...createBaseStats(), largestKillingSpree: 7 })).toBe(10)
    })
  })

  describe('Real game scenarios', () => {
    it('carry with penta + first blood + 15 kill spree = 45 pts', () => {
      const stats = {
        ...createBaseStats(),
        kills: 15,
        deaths: 0,
        assists: 10,
        pentaKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 15,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(45)
    })

    it('noob with triple kill only = 5 pts', () => {
      const stats = {
        ...createBaseStats(),
        kills: 3,
        deaths: 2,
        assists: 8,
        tripleKills: 1,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(5)
    })

    it('noob with first blood + 7 kill spree = 15 pts', () => {
      const stats = {
        ...createBaseStats(),
        kills: 7,
        deaths: 1,
        assists: 12,
        firstBloodKill: true,
        largestKillingSpree: 7,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(15)
    })

    it('carry with 2 quadras + first blood = 35 pts', () => {
      const stats = {
        ...createBaseStats(),
        kills: 12,
        deaths: 2,
        assists: 8,
        quadraKills: 2,
        firstBloodKill: true,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(35) // 30 + 5
    })

    it('average game with no special bonuses = 0 pts', () => {
      const stats = {
        ...createBaseStats(),
        kills: 5,
        deaths: 3,
        assists: 10,
        largestKillingSpree: 3,
      }
      const bonus = calculatePlayerSpecialBonus(stats)
      expect(bonus).toBe(0)
    })
  })
})
