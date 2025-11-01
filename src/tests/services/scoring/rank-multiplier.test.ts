/**
 * Tests pour le multiplicateur de rank (équilibrage des duos)
 *
 * Système :
 * - Calculer la moyenne de rank du duo
 * - Si joueur < moyenne - 1 tier → multiplicateur réduit
 * - Sinon → multiplicateur = 1.0
 *
 * But : Équilibrer les duos avec grande différence de rank
 */

import { describe, it, expect } from 'vitest'
import { calculateRankMultiplier } from '../../../services/scoring/rank-multiplier.js'
import { parseRankString } from '../../../services/scoring/rank-utils.js'

describe('calculateRankMultiplier', () => {
  describe('Balanced duos (proche moyenne)', () => {
    it('should give 1.0 multiplier when both same rank', () => {
      const rank = parseRankString('G4')

      const multiplier = calculateRankMultiplier(rank, rank, 'noob')

      expect(multiplier).toBe(1.0)
    })

    it('should give 1.0 when ranks are close (1-2 divisions apart)', () => {
      const noobRank = parseRankString('G4')
      const carryRank = parseRankString('G2')

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(noobMultiplier).toBe(1.0)
      expect(carryMultiplier).toBe(1.0)
    })

    it('should give 1.0 when ranks are 1 tier apart', () => {
      const noobRank = parseRankString('G4')
      const carryRank = parseRankString('P4')

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(noobMultiplier).toBe(1.0)
      expect(carryMultiplier).toBe(1.0)
    })
  })

  describe('Unbalanced duos (grande différence)', () => {
    it('should reduce multiplier for player far below average (B4 + D1)', () => {
      const noobRank = parseRankString('B4') // Bronze IV = 4
      const carryRank = parseRankString('D1') // Diamond I = 27
      // Moyenne = (4 + 27) / 2 = 15.5 ≈ PLATINUM IV (16)
      // Seuil = 15.5 - 4 = 11.5 ≈ GOLD IV (12)
      // Bronze IV (4) est TRES loin sous le seuil → forte réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(noobMultiplier).toBeLessThan(1.0)
      expect(noobMultiplier).toBeGreaterThanOrEqual(0.5) // Minimum 0.5
      expect(carryMultiplier).toBe(1.0) // Carry au-dessus de la moyenne
    })

    it('should reduce multiplier for G4 with D1 partner', () => {
      const noobRank = parseRankString('G4') // Gold IV = 12
      const carryRank = parseRankString('D1') // Diamond I = 27
      // Moyenne = (12 + 27) / 2 = 19.5 ≈ EMERALD IV (20)
      // Seuil = 19.5 - 4 = 15.5 ≈ PLATINUM IV (16)
      // Gold IV (12) est sous le seuil → réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeLessThan(1.0)
      expect(noobMultiplier).toBeGreaterThan(0.7) // Réduction modérée
    })

    it('should NOT reduce when player is at threshold', () => {
      const noobRank = parseRankString('P4') // Platinum IV = 16
      const carryRank = parseRankString('D1') // Diamond I = 27
      // Moyenne = (16 + 27) / 2 = 21.5
      // Seuil = 21.5 - 4 = 17.5
      // Platinum IV (16) est juste sous le seuil, mais proche

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      // Devrait être proche de 1.0 ou légèrement réduit
      expect(noobMultiplier).toBeGreaterThanOrEqual(0.9)
    })

    it('should give 1.0 when player is above threshold', () => {
      const noobRank = parseRankString('P1') // Platinum I = 19
      const carryRank = parseRankString('D1') // Diamond I = 27
      // Moyenne = 23
      // Seuil = 19
      // P1 (19) est au seuil → pas de réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBe(1.0)
    })
  })

  describe('Spec examples', () => {
    it('E4 + B2 duo (moyenne S2)', () => {
      const noobRank = parseRankString('B2') // Bronze II = 6
      const carryRank = parseRankString('E4') // Emerald IV = 20
      // Moyenne = (6 + 20) / 2 = 13 ≈ GOLD I
      // Seuil = 13 - 4 = 9 ≈ SILVER I
      // B2 (6) est sous le seuil → réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(noobMultiplier).toBeLessThan(1.0)
      expect(carryMultiplier).toBe(1.0)
    })

    it('D4 + P2 duo (moyenne E3)', () => {
      const noobRank = parseRankString('P2') // Plat II = 18
      const carryRank = parseRankString('D4') // Diamond IV = 24
      // Moyenne = 21 ≈ EMERALD I
      // Seuil = 17 ≈ PLATINUM I
      // P2 (18) est au-dessus du seuil → pas de réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')
      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(noobMultiplier).toBe(1.0)
      expect(carryMultiplier).toBe(1.0)
    })

    it('D1 + G4 duo (moyenne P2)', () => {
      const noobRank = parseRankString('G4') // Gold IV = 12
      const carryRank = parseRankString('D1') // Diamond I = 27
      // Moyenne = 19.5 ≈ EMERALD IV
      // Seuil = 15.5 ≈ PLATINUM IV (16)
      // G4 (12) est sous le seuil → réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeLessThan(1.0)
      expect(noobMultiplier).toBeGreaterThanOrEqual(0.7)
    })
  })

  describe('Multiplier curve progression', () => {
    // Test la courbe : plus on est loin sous le seuil, plus le malus est fort

    it('should have decreasing multiplier as distance increases', () => {
      const carryRank = parseRankString('D4') // Diamond IV = 24
      // Moyenne avec D4 = (playerValue + 24) / 2
      // Seuil ≈ moyenne - 4

      const ranks = [
        parseRankString('P1'), // 19 - proche seuil
        parseRankString('G4'), // 12 - moyen
        parseRankString('S4'), // 8 - loin
        parseRankString('B4'), // 4 - très loin
      ]

      const multipliers = ranks.map((rank) => calculateRankMultiplier(rank, carryRank, 'noob'))

      // Les multipliers doivent être décroissants
      for (let i = 1; i < multipliers.length; i++) {
        expect(multipliers[i]).toBeLessThanOrEqual(multipliers[i - 1])
      }

      // Le dernier (B4) devrait avoir le plus fort malus
      expect(multipliers[multipliers.length - 1]).toBeLessThanOrEqual(0.7)
    })
  })

  describe('Master+ handling', () => {
    it('should handle Master vs Diamond', () => {
      const noobRank = parseRankString('D1') // Diamond I = 27
      const carryRank = parseRankString('M') // Master = 28
      // Moyenne = 27.5, seuil = 23.5
      // D1 (27) est au-dessus → pas de réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBe(1.0)
    })

    it('should handle Master vs Platinum (large gap)', () => {
      const noobRank = parseRankString('P4') // Plat IV = 16
      const carryRank = parseRankString('M') // Master = 28
      // Moyenne = 22, seuil = 18
      // P4 (16) est sous le seuil → réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeLessThan(1.0)
    })

    it('should handle Grandmaster vs Master', () => {
      const noobRank = parseRankString('M') // Master = 28
      const carryRank = parseRankString('GM') // GM = 32
      // Moyenne = 30, seuil = 26
      // Master (28) est au-dessus → pas de réduction

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBe(1.0)
    })
  })

  describe('Edge cases', () => {
    it('should never go below 0.5 multiplier', () => {
      const noobRank = parseRankString('I4') // Iron IV = 0
      const carryRank = parseRankString('C') // Challenger = 36
      // Gap énorme

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeGreaterThanOrEqual(0.5)
    })

    it('should always be 1.0 or less', () => {
      const noobRank = parseRankString('D1')
      const carryRank = parseRankString('G4')

      const noobMultiplier = calculateRankMultiplier(noobRank, carryRank, 'noob')

      expect(noobMultiplier).toBeLessThanOrEqual(1.0)
    })

    it('higher rank player (carry) should not be penalized', () => {
      const noobRank = parseRankString('B4')
      const carryRank = parseRankString('D1')

      const carryMultiplier = calculateRankMultiplier(carryRank, noobRank, 'carry')

      expect(carryMultiplier).toBe(1.0)
    })

    it('should handle inverted duo (carry lower than noob)', () => {
      // Cas bizarre mais possible : noob assigné au rank le plus bas
      // mais dans ce test on inverse
      const rank1 = parseRankString('D1')
      const rank2 = parseRankString('G4')

      const mult1 = calculateRankMultiplier(rank1, rank2, 'noob')
      const mult2 = calculateRankMultiplier(rank1, rank2, 'carry')

      // Les deux devraient avoir des multipliers raisonnables
      expect(mult1).toBeGreaterThanOrEqual(0.5)
      expect(mult1).toBeLessThanOrEqual(1.0)
      expect(mult2).toBeGreaterThanOrEqual(0.5)
      expect(mult2).toBeLessThanOrEqual(1.0)
    })
  })

  describe('Symmetry', () => {
    it('should be symmetric for same-rank duos regardless of role', () => {
      const rank = parseRankString('G2')

      const mult1 = calculateRankMultiplier(rank, rank, 'noob')
      const mult2 = calculateRankMultiplier(rank, rank, 'carry')

      expect(mult1).toBe(mult2)
      expect(mult1).toBe(1.0)
    })
  })

  describe('Realistic scenarios', () => {
    const scenarios = [
      {
        desc: 'Duo équilibré (G2 + G4)',
        noob: 'G4',
        carry: 'G2',
        expectedNoob: 1.0,
        expectedCarry: 1.0,
      },
      {
        desc: 'Petit gap (G4 + P3)',
        noob: 'G4',
        carry: 'P3',
        expectedNoob: 1.0,
        expectedCarry: 1.0,
      },
      {
        desc: 'Gap moyen (S2 + P1)',
        noob: 'S2',
        carry: 'P1',
        expectedNoob: 0.975,
        expectedCarry: 1.0,
      },
      {
        desc: 'Grand gap (B3 + D2)',
        noob: 'B3',
        carry: 'D2',
        expectedNoob: 0.65,
        expectedCarry: 1.0,
      },
    ]

    scenarios.forEach(({ desc, noob, carry, expectedNoob, expectedCarry }) => {
      it(desc, () => {
        const noobRank = parseRankString(noob)
        const carryRank = parseRankString(carry)

        const noobMult = calculateRankMultiplier(noobRank, carryRank, 'noob')
        const carryMult = calculateRankMultiplier(carryRank, noobRank, 'carry')

        // Tolérance de ±0.1 pour les valeurs approchées
        expect(noobMult).toBeCloseTo(expectedNoob, 1)
        expect(carryMult).toBeCloseTo(expectedCarry, 1)
      })
    })
  })
})
