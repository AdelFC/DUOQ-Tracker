/**
 * Tests pour le calcul du bonus de prise de risque (DUO)
 * Formules (SPECIFICATIONS.md v2.1 - Section 5):
 *
 * Évaluation (4 conditions):
 * 1. Noob hors rôle principal?
 * 2. Noob hors champion principal?
 * 3. Carry hors rôle principal?
 * 4. Carry hors champion principal?
 *
 * H = nombre de conditions vraies
 *
 * Bonus selon H:
 * - H = 4: +25 points
 * - H = 3: +15 points
 * - H = 2: +5 points
 * - H ≤ 1: 0 points
 */

import { describe, it, expect } from 'vitest'
import { calculateRiskBonus } from '../../../services/scoring/risk.js'
import type { RiskBonus } from '../../../types/scoring.js'
import type { Lane } from '../../../types/player.js'

describe('calculateRiskBonus', () => {
  describe('H = 0 (full comfort)', () => {
    it('should give 0 points when both on-role and on-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: false,
        carryOffRole: false,
        carryOffChampion: false,
      })

      expect(result.offRole).toBe(0)
      expect(result.offChampion).toBe(0)
      expect(result.final).toBe(0)
    })
  })

  describe('H = 1 (pas de bonus)', () => {
    it('should give 0 points when only noob off-role', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: false,
        carryOffRole: false,
        carryOffChampion: false,
      })

      expect(result.final).toBe(0)
    })

    it('should give 0 points when only noob off-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: true,
        carryOffRole: false,
        carryOffChampion: false,
      })

      expect(result.final).toBe(0)
    })

    it('should give 0 points when only carry off-role', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: false,
        carryOffRole: true,
        carryOffChampion: false,
      })

      expect(result.final).toBe(0)
    })

    it('should give 0 points when only carry off-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: false,
        carryOffRole: false,
        carryOffChampion: true,
      })

      expect(result.final).toBe(0)
    })
  })

  describe('H = 2 (petit bonus)', () => {
    it('should give +5 points when noob fully off (role + champion)', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: true,
        carryOffRole: false,
        carryOffChampion: false,
      })

      expect(result.final).toBe(5)
    })

    it('should give +5 points when carry fully off', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: false,
        carryOffRole: true,
        carryOffChampion: true,
      })

      expect(result.final).toBe(5)
    })

    it('should give +5 points when both off-role (but on-champion)', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: false,
        carryOffRole: true,
        carryOffChampion: false,
      })

      expect(result.final).toBe(5)
    })

    it('should give +5 points when both off-champion (but on-role)', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: true,
        carryOffRole: false,
        carryOffChampion: true,
      })

      expect(result.final).toBe(5)
    })

    it('should give +5 points when noob off-role + carry off-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: false,
        carryOffRole: false,
        carryOffChampion: true,
      })

      expect(result.final).toBe(5)
    })
  })

  describe('H = 3 (bon bonus)', () => {
    it('should give +15 points when noob fully off + carry off-role', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: true,
        carryOffRole: true,
        carryOffChampion: false,
      })

      expect(result.final).toBe(15)
    })

    it('should give +15 points when noob fully off + carry off-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: true,
        carryOffRole: false,
        carryOffChampion: true,
      })

      expect(result.final).toBe(15)
    })

    it('should give +15 points when carry fully off + noob off-role', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: false,
        carryOffRole: true,
        carryOffChampion: true,
      })

      expect(result.final).toBe(15)
    })

    it('should give +15 points when carry fully off + noob off-champion', () => {
      const result = calculateRiskBonus({
        noobOffRole: false,
        noobOffChampion: true,
        carryOffRole: true,
        carryOffChampion: true,
      })

      expect(result.final).toBe(15)
    })
  })

  describe('H = 4 (max bonus)', () => {
    it('should give +25 points when both fully off (role + champion)', () => {
      const result = calculateRiskBonus({
        noobOffRole: true,
        noobOffChampion: true,
        carryOffRole: true,
        carryOffChampion: true,
      })

      expect(result.final).toBe(25)
    })
  })

  describe('Spec example', () => {
    it('example from spec: noob TOP/Darius (main MID/Ahri) + carry ADC/Caitlyn (main ADC/Jinx)', () => {
      // Noob: main MID/Ahri, joue TOP/Darius → 2 conditions (off-role + off-champion)
      // Carry: main ADC/Jinx, joue ADC/Caitlyn → 1 condition (off-champion)
      // Total H = 3 → +15 points

      const result = calculateRiskBonus({
        noobOffRole: true, // TOP ≠ MID
        noobOffChampion: true, // Darius ≠ Ahri
        carryOffRole: false, // ADC = ADC
        carryOffChampion: true, // Caitlyn ≠ Jinx
      })

      expect(result.final).toBe(15)
    })
  })

  describe('Edge cases', () => {
    it('should handle all possible H values', () => {
      // H = 0
      expect(
        calculateRiskBonus({
          noobOffRole: false,
          noobOffChampion: false,
          carryOffRole: false,
          carryOffChampion: false,
        }).final
      ).toBe(0)

      // H = 1
      expect(
        calculateRiskBonus({
          noobOffRole: true,
          noobOffChampion: false,
          carryOffRole: false,
          carryOffChampion: false,
        }).final
      ).toBe(0)

      // H = 2
      expect(
        calculateRiskBonus({
          noobOffRole: true,
          noobOffChampion: true,
          carryOffRole: false,
          carryOffChampion: false,
        }).final
      ).toBe(5)

      // H = 3
      expect(
        calculateRiskBonus({
          noobOffRole: true,
          noobOffChampion: true,
          carryOffRole: true,
          carryOffChampion: false,
        }).final
      ).toBe(15)

      // H = 4
      expect(
        calculateRiskBonus({
          noobOffRole: true,
          noobOffChampion: true,
          carryOffRole: true,
          carryOffChampion: true,
        }).final
      ).toBe(25)
    })
  })
})
