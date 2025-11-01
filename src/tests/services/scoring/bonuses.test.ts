/**
 * Tests pour les bonus spéciaux
 * Formules (SPECIFICATIONS.md v2.1 - Section 6):
 *
 * Bonus Duo "No Death":
 * - Condition: Les 2 joueurs du duo ont 0 death
 * - Bonus: +20 points au duo
 *
 * NOTE: Les autres bonus (MVP, Pentakill) sont optionnels et pas implémentés pour v1
 */

import { describe, it, expect } from 'vitest'
import { calculateNoDeathBonus } from '../../../services/scoring/bonuses.js'

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
