/**
 * Tests pour le multiplicateur Peak Elo
 * Système anti-smurf avec bonus pour progression
 */

import { describe, it, expect } from 'vitest'
import { calculatePeakEloMultiplier } from '../../../services/scoring/peak-elo-multiplier.js'
import type { RankInfo } from '../../../types/player.js'

describe('calculatePeakEloMultiplier', () => {
  // ========================================
  // BONUS - Au-dessus du peak elo
  // ========================================
  describe('BONUS - Dépassement du peak elo', () => {
    it('applique +5% bonus pour +1 tier au-dessus', () => {
      const peakElo = 'G4' // Peak = Gold 4 (value 12)
      const currentRank: RankInfo = { tier: 'PLATINUM', division: 'IV', lp: 0 } // P4 = 16, +4 divs = +1 tier exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.05) // +5%
    })

    it('applique +10% bonus pour +2 tiers au-dessus', () => {
      const peakElo = 'G4' // Peak = Gold 4 (value 12)
      const currentRank: RankInfo = { tier: 'EMERALD', division: 'IV', lp: 0 } // E4 = 20, +8 divs = +2 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.1) // +10%
    })

    it('applique +15% bonus pour +3 tiers au-dessus', () => {
      const peakElo = 'G4' // Peak = Gold 4 (value 12)
      const currentRank: RankInfo = { tier: 'DIAMOND', division: 'IV', lp: 0 } // D4 = 24, +12 divs = +3 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.15) // +15%
    })

    it('applique +15% bonus max pour +3+ tiers au-dessus', () => {
      const peakElo = 'S4' // Peak = Silver 4 (value 8)
      const currentRank: RankInfo = { tier: 'DIAMOND', division: 'IV', lp: 0 } // D4 = 24, +16 divs = +4 tiers

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.15) // +15% max (cap à +3)
    })
  })

  // ========================================
  // TOLÉRANCE - À son elo ou légèrement en dessous
  // ========================================
  describe('TOLÉRANCE - 0-1 tier en dessous du peak', () => {
    it('aucun malus si à son peak elo exact', () => {
      const peakElo = 'P2' // Peak = Plat 2
      const currentRank: RankInfo = { tier: 'PLATINUM', division: 'II', lp: 75 }

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.0) // Aucun malus
    })

    it('aucun malus si 1 division en dessous (même tier)', () => {
      const peakElo = 'P2' // Peak = Plat 2
      const currentRank: RankInfo = { tier: 'PLATINUM', division: 'III', lp: 0 } // -1 division

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.0) // Tolérance
    })

    it('aucun malus si 1 tier en dessous', () => {
      const peakElo = 'P4' // Peak = Plat 4
      const currentRank: RankInfo = { tier: 'GOLD', division: 'II', lp: 50 } // -1 tier

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.0) // Tolérance
    })
  })

  // ========================================
  // MALUS - Smurfs (2+ tiers en dessous)
  // ========================================
  describe('MALUS - Anti-smurf', () => {
    it('applique -5% malus pour 2 tiers en dessous', () => {
      const peakElo = 'P4' // Peak = Plat 4 (value 16)
      const currentRank: RankInfo = { tier: 'SILVER', division: 'IV', lp: 0 } // S4 = 8, -8 divs = -2 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.95) // -5%
    })

    it('applique -12.5% malus pour 3 tiers en dessous', () => {
      const peakElo = 'D4' // Peak = Diamant 4 (value 24)
      const currentRank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 0 } // G4 = 12, -12 divs = -3 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.875) // -12.5%
    })

    it('applique -20% malus pour 4 tiers en dessous', () => {
      const peakElo = 'E4' // Peak = Emeraude 4 (value 20)
      const currentRank: RankInfo = { tier: 'BRONZE', division: 'IV', lp: 0 } // B4 = 4, -16 divs = -4 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.8) // -20%
    })

    it('applique -25% malus max pour 5 tiers en dessous', () => {
      const peakElo = 'D4' // Peak = Diamant 4 (value 24)
      const currentRank: RankInfo = { tier: 'BRONZE', division: 'IV', lp: 0 } // B4 = 4, -20 divs = -5 tiers exact

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.75) // -25% max
    })

    it('applique -25% malus max pour 6+ tiers en dessous (cap)', () => {
      const peakElo = 'D1' // Peak = Diamant 1 (value 27)
      const currentRank: RankInfo = { tier: 'BRONZE', division: 'IV', lp: 0 } // B4 = 4, -23 divs = -5.75 tiers → floor = -6

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.75) // -25% max (cap)
    })
  })

  // ========================================
  // CAS RÉELS - Scénarios typiques
  // ========================================
  describe('Scénarios réels', () => {
    it('Diamant smurf en Bronze (gros smurf)', () => {
      const peakElo = 'D4'
      const currentRank: RankInfo = { tier: 'BRONZE', division: 'IV', lp: 0 }

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.75) // -25% malus max
    })

    it('Emeraude smurf en Silver (smurf moyen)', () => {
      const peakElo = 'E4'
      const currentRank: RankInfo = { tier: 'SILVER', division: 'IV', lp: 0 }

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.875) // -12.5% malus
    })

    it('Plat smurf en Silver (2 tiers en dessous)', () => {
      const peakElo = 'P4' // value 16
      const currentRank: RankInfo = { tier: 'SILVER', division: 'IV', lp: 0 } // value 8, -8 divs = -2 tiers

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(0.95) // -5% malus
    })

    it('Joueur qui climb au-dessus de son peak (progression +2 tiers)', () => {
      const peakElo = 'G2' // value 14
      const currentRank: RankInfo = { tier: 'EMERALD', division: 'II', lp: 50 } // value 22, +8 divs = +2 tiers

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.1) // +10% bonus
    })

    it('Joueur en légère descente (meta shift)', () => {
      const peakElo = 'P1'
      const currentRank: RankInfo = { tier: 'PLATINUM', division: 'IV', lp: 0 }

      const multiplier = calculatePeakEloMultiplier(peakElo, currentRank)

      expect(multiplier).toBe(1.0) // Tolérance, pas de malus
    })
  })
})
