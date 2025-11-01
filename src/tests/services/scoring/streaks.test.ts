/**
 * Tests pour le calcul des bonus/malus de streaks
 * Formules (SPECIFICATIONS.md v2.1 - Section 4):
 * Win Streaks:
 * - 3 wins consécutives: +10 points
 * - 5 wins consécutives: +25 points
 * - 7 wins consécutives: +50 points
 *
 * Lose Streaks:
 * - 3 losses consécutives: -10 points
 * - 5 losses consécutives: -25 points
 *
 * NOTE: Le bonus/malus s'applique sur la game qui atteint le seuil
 */

import { describe, it, expect } from 'vitest'
import { calculateStreakBonus } from '../../../services/scoring/streaks.js'

describe('calculateStreakBonus', () => {
  describe('Win Streaks', () => {
    it('should give 0 points for 0-1 wins, +10 for 2→3', () => {
      expect(calculateStreakBonus(true, 0)).toBe(0) // 0 avant → 1ère victoire (streak devient 1)
      expect(calculateStreakBonus(true, 1)).toBe(0) // 1 avant → 2ème victoire (streak devient 2)
      expect(calculateStreakBonus(true, 2)).toBe(10) // 2 avant → 3ème victoire (streak devient 3 → +10)
    })

    it('should give +10 points for reaching 3 wins', () => {
      const bonus = calculateStreakBonus(true, 2) // 2 wins avant → cette game atteint 3
      expect(bonus).toBe(10)
    })

    it('should give 0 points for 4 wins (pas de seuil)', () => {
      const bonus = calculateStreakBonus(true, 3) // 3 wins avant → 4ème win
      expect(bonus).toBe(0) // Pas de seuil à 4
    })

    it('should give +25 points for reaching 5 wins', () => {
      const bonus = calculateStreakBonus(true, 4) // 4 wins avant → atteint 5
      expect(bonus).toBe(25)
    })

    it('should give 0 points for 6 wins (pas de seuil)', () => {
      const bonus = calculateStreakBonus(true, 5)
      expect(bonus).toBe(0)
    })

    it('should give +50 points for reaching 7 wins', () => {
      const bonus = calculateStreakBonus(true, 6) // 6 wins avant → atteint 7
      expect(bonus).toBe(50)
    })

    it('should give 0 points for 8+ wins (pas de seuil)', () => {
      expect(calculateStreakBonus(true, 7)).toBe(0)
      expect(calculateStreakBonus(true, 10)).toBe(0)
      expect(calculateStreakBonus(true, 100)).toBe(0)
    })
  })

  describe('Loss Streaks', () => {
    it('should give 0 points for 0-1 losses, -10 for 2→3', () => {
      expect(calculateStreakBonus(false, 0)).toBe(0) // 0 avant → 1ère défaite (streak devient -1)
      expect(calculateStreakBonus(false, -1)).toBe(0) // -1 avant → 2ème défaite (streak devient -2)
      expect(calculateStreakBonus(false, -2)).toBe(-10) // -2 avant → 3ème défaite (streak devient -3 → -10)
    })

    it('should give -10 points for reaching 3 losses', () => {
      const bonus = calculateStreakBonus(false, -2) // 2 losses avant → atteint 3
      expect(bonus).toBe(-10)
    })

    it('should give 0 points for 4 losses (pas de seuil)', () => {
      const bonus = calculateStreakBonus(false, -3)
      expect(bonus).toBe(0)
    })

    it('should give -25 points for reaching 5 losses', () => {
      const bonus = calculateStreakBonus(false, -4) // 4 losses avant → atteint 5
      expect(bonus).toBe(-25)
    })

    it('should give 0 points for 6+ losses (pas de seuil)', () => {
      expect(calculateStreakBonus(false, -5)).toBe(0)
      expect(calculateStreakBonus(false, -10)).toBe(0)
      expect(calculateStreakBonus(false, -100)).toBe(0)
    })
  })

  describe('Streak resets', () => {
    it('win after losses should give 0 bonus', () => {
      const bonus = calculateStreakBonus(true, -5) // Était en loss streak
      expect(bonus).toBe(0) // Pas de bonus, c'est un reset
    })

    it('loss after wins should give 0 malus', () => {
      const bonus = calculateStreakBonus(false, 5) // Était en win streak
      expect(bonus).toBe(0) // Pas de malus, c'est un reset
    })

    it('win after 0 streak should give 0 bonus', () => {
      const bonus = calculateStreakBonus(true, 0)
      expect(bonus).toBe(0)
    })

    it('loss after 0 streak should give 0 malus', () => {
      const bonus = calculateStreakBonus(false, 0)
      expect(bonus).toBe(0)
    })
  })

  describe('Comprehensive scenarios', () => {
    const winScenarios = [
      { streak: 0, expected: 0, desc: '1st win' },
      { streak: 1, expected: 0, desc: '2nd win' },
      { streak: 2, expected: 10, desc: '3rd win → +10' },
      { streak: 3, expected: 0, desc: '4th win' },
      { streak: 4, expected: 25, desc: '5th win → +25' },
      { streak: 5, expected: 0, desc: '6th win' },
      { streak: 6, expected: 50, desc: '7th win → +50' },
      { streak: 7, expected: 0, desc: '8th win' },
    ]

    it.each(winScenarios)('$desc (streak=$streak)', ({ streak, expected }) => {
      const bonus = calculateStreakBonus(true, streak)
      expect(bonus).toBe(expected)
    })

    const lossScenarios = [
      { streak: 0, expected: 0, desc: '1st loss' },
      { streak: -1, expected: 0, desc: '2nd loss' },
      { streak: -2, expected: -10, desc: '3rd loss → -10' },
      { streak: -3, expected: 0, desc: '4th loss' },
      { streak: -4, expected: -25, desc: '5th loss → -25' },
      { streak: -5, expected: 0, desc: '6th loss' },
    ]

    it.each(lossScenarios)('$desc (streak=$streak)', ({ streak, expected }) => {
      const bonus = calculateStreakBonus(false, streak)
      expect(bonus).toBe(expected)
    })
  })

  describe('Edge cases', () => {
    it('should handle very high positive streaks', () => {
      const bonus = calculateStreakBonus(true, 100)
      expect(bonus).toBe(0) // Pas de seuil après 7
    })

    it('should handle very high negative streaks', () => {
      const bonus = calculateStreakBonus(false, -100)
      expect(bonus).toBe(0) // Pas de seuil après 5
    })
  })

  describe('Clarification: "atteindre le seuil"', () => {
    it('streak of 2 → this win reaches 3 → bonus applies', () => {
      // Le joueur a 2 wins avant cette game
      // Cette game est une victoire → il atteint 3 wins
      const bonus = calculateStreakBonus(true, 2)
      expect(bonus).toBe(10)
    })

    it('streak of 3 → this win reaches 4 → no bonus', () => {
      // Le joueur a 3 wins, cette game atteint 4
      const bonus = calculateStreakBonus(true, 3)
      expect(bonus).toBe(0) // Pas de seuil à 4
    })

    it('streak of 4 → this win reaches 5 → bonus applies', () => {
      const bonus = calculateStreakBonus(true, 4)
      expect(bonus).toBe(25) // Atteint 5 = +25 (pas +10, juste +25)
    })
  })
})
