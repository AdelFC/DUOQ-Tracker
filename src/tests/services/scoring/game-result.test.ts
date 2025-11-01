/**
 * Tests pour le calcul du score de résultat de partie
 * Formules (SPECIFICATIONS.md v2.1 - Section 2):
 * - Victoire standard: +5 points
 * - Victoire rapide (< 25 min): +8 points
 * - Défaite: -5 points
 * - FF/Surrender: -10 points
 * - Remake: 0 points
 *
 * NOTE: Les streaks sont calculés dans un module séparé (section 4)
 */

import { describe, it, expect } from 'vitest'
import { calculateGameResult } from '../../../services/scoring/game-result.js'

describe('calculateGameResult', () => {
  describe('Victoires', () => {
    it('should give +5 points for standard win', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1800, // 30 minutes
        surrender: false,
        remake: false,
      })

      expect(result.basePoints).toBe(5)
      expect(result.streakBonus).toBe(0)
      expect(result.final).toBe(5)
    })

    it('should give +8 points for fast win (< 25 min)', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1400, // 23:20
        surrender: false,
        remake: false,
      })

      expect(result.basePoints).toBe(8)
      expect(result.streakBonus).toBe(0)
      expect(result.final).toBe(8)
    })

    it('should give +5 points for win at exactly 25:00', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1500, // 25:00
        surrender: false,
        remake: false,
      })

      expect(result.basePoints).toBe(5) // Pas de bonus si >= 25 min
      expect(result.final).toBe(5)
    })

    it('should give +8 points for win at 24:59', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1499, // 24:59
        surrender: false,
        remake: false,
      })

      expect(result.basePoints).toBe(8)
      expect(result.final).toBe(8)
    })
  })

  describe('Défaites', () => {
    it('should give -5 points for standard loss', () => {
      const result = calculateGameResult({
        win: false,
        duration: 1800,
        surrender: false,
        remake: false,
      })

      expect(result.basePoints).toBe(-5)
      expect(result.streakBonus).toBe(0)
      expect(result.final).toBe(-5)
    })

    it('should give -10 points for FF/surrender', () => {
      const result = calculateGameResult({
        win: false,
        duration: 1200, // 20 min
        surrender: true,
        remake: false,
      })

      expect(result.basePoints).toBe(-10)
      expect(result.streakBonus).toBe(0)
      expect(result.final).toBe(-10)
    })
  })

  describe('Cas spéciaux', () => {
    it('should give 0 points for remake', () => {
      const result = calculateGameResult({
        win: false,
        duration: 180, // 3 min
        surrender: false,
        remake: true,
      })

      expect(result.basePoints).toBe(0)
      expect(result.streakBonus).toBe(0)
      expect(result.final).toBe(0)
    })

    it('remake should override all other conditions', () => {
      // Remake avec win = true (cas bizarre mais possible)
      const result = calculateGameResult({
        win: true,
        duration: 180,
        surrender: true,
        remake: true,
      })

      expect(result.basePoints).toBe(0) // Remake prioritaire
      expect(result.final).toBe(0)
    })

    it('FF should override standard loss', () => {
      const result = calculateGameResult({
        win: false,
        duration: 1200,
        surrender: true,
        remake: false,
      })

      expect(result.basePoints).toBe(-10) // FF, pas -5
      expect(result.final).toBe(-10)
    })
  })

  describe('Priorités (selon spec)', () => {
    // Priorité: Remake > FF > Win <25min > Win > Loss

    it('priority: remake over everything', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1400, // fast win
        surrender: true,
        remake: true,
      })

      expect(result.final).toBe(0) // Remake wins
    })

    it('priority: FF over standard loss', () => {
      const result = calculateGameResult({
        win: false,
        duration: 1800,
        surrender: true,
        remake: false,
      })

      expect(result.final).toBe(-10) // FF wins
    })

    it('priority: fast win over standard win', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1400, // < 25 min
        surrender: false,
        remake: false,
      })

      expect(result.final).toBe(8) // Fast win wins
    })
  })

  describe('Edge cases', () => {
    it('should handle very short games', () => {
      const result = calculateGameResult({
        win: true,
        duration: 600, // 10 min
        surrender: false,
        remake: false,
      })

      expect(result.final).toBe(8) // Fast win
    })

    it('should handle very long games', () => {
      const result = calculateGameResult({
        win: true,
        duration: 3600, // 60 min
        surrender: false,
        remake: false,
      })

      expect(result.final).toBe(5) // Standard win
    })

    it('should handle surrender on win (théoriquement impossible)', () => {
      const result = calculateGameResult({
        win: true,
        duration: 1800,
        surrender: true,
        remake: false,
      })

      // Même si bizarre, on suit la logique: win = prioritaire sur surrender
      expect(result.final).toBeGreaterThanOrEqual(5)
    })
  })
})
