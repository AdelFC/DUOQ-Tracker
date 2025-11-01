/**
 * Tests pour le calcul du score KDA
 * Formules (SPECIFICATIONS.md v2.1):
 * - Base: P_base = 1.0*K + 0.5*A - 1.0*D
 * - Noob (bonus): P_KDA = P_base + 0.5*K + 0.25*A
 * - Carry (malus): P_KDA = P_base - 0.5*D
 */

import { describe, it, expect } from 'vitest'
import { calculateKDA } from '../../../services/scoring/kda.js'
import type { KDAInput } from '../../../types/scoring.js'

describe('calculateKDA', () => {
  describe('Noob role (avec bonus)', () => {
    const cases: Array<{ K: number; D: number; A: number; expected: number; description: string }> = [
      // Cas de la spec (exemple complet)
      { K: 8, D: 2, A: 12, expected: 19, description: '8/2/12 = 19pts (cas spec)' },

      // Cas simples
      { K: 10, D: 3, A: 15, expected: 23.25, description: '10/3/15 = 23.25pts' },
      { K: 5, D: 5, A: 10, expected: 10, description: '5/5/10 = 10pts (neutre)' },
      { K: 0, D: 10, A: 0, expected: -10, description: '0/10/0 = -10pts (feed)' },

      // Perfect KDA (no deaths)
      // P_base = 15 + 10 - 0 = 25, bonus = 7.5 + 5 = 12.5, total = 37.5
      { K: 15, D: 0, A: 20, expected: 37.5, description: '15/0/20 = 37.5pts (perfect)' },

      // Carry mode (beaucoup de kills)
      // P_base = 20 + 2.5 - 1 = 21.5, bonus = 10 + 1.25 = 11.25, total = 32.75
      { K: 20, D: 1, A: 5, expected: 32.75, description: '20/1/5 = 32.75pts (hardcarry)' },

      // Support mode (beaucoup d\'assists)
      // P_base = 2 + 10 - 1 = 11, bonus = 1 + 5 = 6, total = 17
      { K: 2, D: 1, A: 20, expected: 17, description: '2/1/20 = 17pts (support)' },
    ]

    it.each(cases)('$description', ({ K, D, A, expected }) => {
      const input: KDAInput = { kills: K, deaths: D, assists: A }
      const result = calculateKDA(input, 'noob')

      expect(result.final).toBeCloseTo(expected, 2)
    })

    it('should calculate noob KDA with correct breakdown', () => {
      const input: KDAInput = { kills: 8, deaths: 2, assists: 12 }
      const result = calculateKDA(input, 'noob')

      // P_base = 1*8 + 0.5*12 - 1*2 = 8 + 6 - 2 = 12
      expect(result.base).toBeCloseTo(12, 2)

      // Bonus noob = 0.5*8 + 0.25*12 = 4 + 3 = 7
      expect(result.roleAdjustment).toBeCloseTo(7, 2)

      // Final = 12 + 7 = 19
      expect(result.final).toBeCloseTo(19, 2)
    })
  })

  describe('Carry role (avec malus)', () => {
    const cases: Array<{ K: number; D: number; A: number; expected: number; description: string }> = [
      // Cas similaire au noob mais avec malus
      { K: 8, D: 2, A: 12, expected: 11, description: '8/2/12 = 11pts (malus carry)' },

      // Feed = punition plus sévère
      // P_base = 5 + 2.5 - 10 = -2.5, malus = -5, total = -7.5
      { K: 5, D: 10, A: 5, expected: -7.5, description: '5/10/5 = -7.5pts (feed punished)' },

      // Perfect carry
      // P_base = 15 + 10 - 0 = 25, malus = 0, total = 25
      { K: 15, D: 0, A: 20, expected: 25, description: '15/0/20 = 25pts (perfect carry)' },

      // Hardcarry avec quelques deaths
      // P_base = 20 + 2.5 - 5 = 17.5, malus = -2.5, total = 15
      { K: 20, D: 5, A: 5, expected: 15, description: '20/5/5 = 15pts (hardcarry)' },
    ]

    it.each(cases)('$description', ({ K, D, A, expected }) => {
      const input: KDAInput = { kills: K, deaths: D, assists: A }
      const result = calculateKDA(input, 'carry')

      expect(result.final).toBeCloseTo(expected, 2)
    })

    it('should calculate carry KDA with correct breakdown', () => {
      const input: KDAInput = { kills: 8, deaths: 2, assists: 12 }
      const result = calculateKDA(input, 'carry')

      // P_base = 1*8 + 0.5*12 - 1*2 = 12
      expect(result.base).toBeCloseTo(12, 2)

      // Malus carry = -0.5*2 = -1
      expect(result.roleAdjustment).toBeCloseTo(-1, 2)

      // Final = 12 - 1 = 11
      expect(result.final).toBeCloseTo(11, 2)
    })
  })

  describe('Edge cases', () => {
    it('should handle zero KDA', () => {
      const input: KDAInput = { kills: 0, deaths: 0, assists: 0 }

      const noobResult = calculateKDA(input, 'noob')
      expect(noobResult.final).toBe(0)

      const carryResult = calculateKDA(input, 'carry')
      expect(carryResult.final).toBe(0)
    })

    it('should handle negative results (feeding)', () => {
      const input: KDAInput = { kills: 0, deaths: 20, assists: 0 }

      const noobResult = calculateKDA(input, 'noob')
      expect(noobResult.final).toBeLessThan(0)

      const carryResult = calculateKDA(input, 'carry')
      expect(carryResult.final).toBeLessThan(noobResult.final) // Carry puni plus fort
    })

    it('should handle very high values', () => {
      const input: KDAInput = { kills: 50, deaths: 0, assists: 100 }

      const noobResult = calculateKDA(input, 'noob')
      expect(noobResult.final).toBeGreaterThan(100)

      const carryResult = calculateKDA(input, 'carry')
      expect(carryResult.final).toBeGreaterThan(0)
      expect(carryResult.final).toBeLessThan(noobResult.final)
    })
  })

  describe('Comparaison Noob vs Carry', () => {
    it('noob should get more points than carry for same KDA', () => {
      const input: KDAInput = { kills: 10, deaths: 3, assists: 15 }

      const noobResult = calculateKDA(input, 'noob')
      const carryResult = calculateKDA(input, 'carry')

      expect(noobResult.final).toBeGreaterThan(carryResult.final)
    })

    it('carry should be punished more for deaths', () => {
      const highDeaths: KDAInput = { kills: 5, deaths: 10, assists: 5 }

      const noobResult = calculateKDA(highDeaths, 'noob')
      const carryResult = calculateKDA(highDeaths, 'carry')

      // Carry doit avoir un score plus bas (malus mort)
      expect(carryResult.final).toBeLessThan(noobResult.final)
    })

    it('noob should be rewarded more for kills and assists', () => {
      const goodKDA: KDAInput = { kills: 15, deaths: 2, assists: 20 }

      const noobResult = calculateKDA(goodKDA, 'noob')
      const carryResult = calculateKDA(goodKDA, 'carry')

      // Noob doit avoir un bonus significatif
      const difference = noobResult.final - carryResult.final
      expect(difference).toBeGreaterThan(10)
    })
  })
})
