/**
 * Tests pour le calcul des bonus/malus de changement de rank
 * Formules (SPECIFICATIONS.md v2.1 - Section 3):
 * Montée:
 * - +1 division: +50 points
 * - +1 tier: +100 points
 *
 * Descente (double malus):
 * - -1 division: -100 points
 * - -1 tier: -200 points
 */

import { describe, it, expect } from 'vitest'
import { calculateRankChange } from '../../../services/scoring/rank-change.js'
import type { RankInfo } from '../../../types/player.js'

describe('calculateRankChange', () => {
  describe('Division changes (même tier)', () => {
    it('should give +50 points for division up', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'IV', lp: 95 }
      const current: RankInfo = { tier: 'GOLD', division: 'III', lp: 5 }

      const result = calculateRankChange(previous, current)

      expect(result.lpChange).toBe(0) // Pas de conversion LP dans ce cas
      expect(result.multiplier).toBe(1)
      expect(result.tierBonus).toBe(50)
      expect(result.final).toBe(50)
    })

    it('should give -100 points for division down', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'III', lp: 0 }
      const current: RankInfo = { tier: 'GOLD', division: 'IV', lp: 75 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(-100) // Double malus
      expect(result.final).toBe(-100)
    })

    it('should give LP conversion points for no division change (LP only)', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }
      const current: RankInfo = { tier: 'GOLD', division: 'IV', lp: 70 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(0) // No tier/division change
      expect(result.final).toBe(8) // +20 LP × 0.4 = +8 pts
    })
  })

  describe('Tier changes', () => {
    it('should give +100 points for tier up (Gold → Platinum)', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'I', lp: 95 }
      const current: RankInfo = { tier: 'PLATINUM', division: 'IV', lp: 0 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(100)
      expect(result.final).toBe(100)
    })

    it('should give -200 points for tier down (Platinum → Gold)', () => {
      const previous: RankInfo = { tier: 'PLATINUM', division: 'IV', lp: 0 }
      const current: RankInfo = { tier: 'GOLD', division: 'I', lp: 75 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(-200) // Double malus
      expect(result.final).toBe(-200)
    })
  })

  describe('Master+ (no divisions)', () => {
    it('should give +100 points for reaching Master', () => {
      const previous: RankInfo = { tier: 'DIAMOND', division: 'I', lp: 95 }
      const current: RankInfo = { tier: 'MASTER', division: null, lp: 0 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(100)
      expect(result.final).toBe(100)
    })

    it('should give +100 points for Master → GM', () => {
      const previous: RankInfo = { tier: 'MASTER', division: null, lp: 500 }
      const current: RankInfo = { tier: 'GRANDMASTER', division: null, lp: 0 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(100)
      expect(result.final).toBe(100)
    })

    it('should give +100 points for GM → Challenger', () => {
      const previous: RankInfo = { tier: 'GRANDMASTER', division: null, lp: 800 }
      const current: RankInfo = { tier: 'CHALLENGER', division: null, lp: 0 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(100)
      expect(result.final).toBe(100)
    })

    it('should give -200 points for dropping from Master', () => {
      const previous: RankInfo = { tier: 'MASTER', division: null, lp: 0 }
      const current: RankInfo = { tier: 'DIAMOND', division: 'I', lp: 75 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(-200)
      expect(result.final).toBe(-200)
    })

    it('should give LP conversion points for LP change in Master (no tier change)', () => {
      const previous: RankInfo = { tier: 'MASTER', division: null, lp: 100 }
      const current: RankInfo = { tier: 'MASTER', division: null, lp: 150 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(0) // No tier change
      expect(result.final).toBe(20) // +50 LP × 0.4 = +20 pts (Master+ always counts LP)
    })
  })

  describe('Multiple divisions (edge case)', () => {
    it('should give +50 for Gold IV → Gold II (2 divisions up)', () => {
      // NOTE: En théorie impossible en 1 game, mais testons quand même
      const previous: RankInfo = { tier: 'GOLD', division: 'IV', lp: 95 }
      const current: RankInfo = { tier: 'GOLD', division: 'II', lp: 10 }

      const result = calculateRankChange(previous, current)

      // On compte comme 1 montée de division (+50)
      expect(result.tierBonus).toBe(50)
    })

    it('should give -100 for Gold II → Gold IV (2 divisions down)', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'II', lp: 0 }
      const current: RankInfo = { tier: 'GOLD', division: 'IV', lp: 75 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(-100)
    })
  })

  describe('Edge cases', () => {
    it('should handle same rank', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const result = calculateRankChange(rank, rank)

      expect(result.final).toBe(0)
    })

    it('should handle very low ranks', () => {
      const previous: RankInfo = { tier: 'IRON', division: 'IV', lp: 50 }
      const current: RankInfo = { tier: 'IRON', division: 'III', lp: 10 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(50)
      expect(result.final).toBe(50)
    })

    it('should handle IRON → BRONZE', () => {
      const previous: RankInfo = { tier: 'IRON', division: 'I', lp: 95 }
      const current: RankInfo = { tier: 'BRONZE', division: 'IV', lp: 0 }

      const result = calculateRankChange(previous, current)

      expect(result.tierBonus).toBe(100)
      expect(result.final).toBe(100)
    })
  })

  describe('Division order validation', () => {
    // IV → III → II → I (ordre croissant)

    it('Gold IV → Gold III should be +50', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'IV', lp: 95 }
      const current: RankInfo = { tier: 'GOLD', division: 'III', lp: 0 }

      const result = calculateRankChange(previous, current)
      expect(result.tierBonus).toBe(50)
    })

    it('Gold III → Gold II should be +50', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'III', lp: 95 }
      const current: RankInfo = { tier: 'GOLD', division: 'II', lp: 0 }

      const result = calculateRankChange(previous, current)
      expect(result.tierBonus).toBe(50)
    })

    it('Gold II → Gold I should be +50', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'II', lp: 95 }
      const current: RankInfo = { tier: 'GOLD', division: 'I', lp: 0 }

      const result = calculateRankChange(previous, current)
      expect(result.tierBonus).toBe(50)
    })

    it('Gold I → Platinum IV should be +100 (tier)', () => {
      const previous: RankInfo = { tier: 'GOLD', division: 'I', lp: 95 }
      const current: RankInfo = { tier: 'PLATINUM', division: 'IV', lp: 0 }

      const result = calculateRankChange(previous, current)
      expect(result.tierBonus).toBe(100)
    })
  })
})
