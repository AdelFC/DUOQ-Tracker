/**
 * Test unitaire pour le calcul dynamique d'intervalle de l'AutoPollService
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { State } from '../../types/state.js'
import type { Duo } from '../../types/duo.js'

/**
 * Simulate AutoPollService interval calculation (tiered system)
 * (Extracted for testing without Discord dependencies)
 */
function calculateInterval(nbDuos: number): number {
  const TIER_INTERVALS = [
    { maxDuos: 4, intervalMs: 30000 },   // 1-4 duos: 30s
    { maxDuos: 8, intervalMs: 45000 },   // 5-8 duos: 45s
    { maxDuos: 12, intervalMs: 60000 },  // 9-12 duos: 60s
    { maxDuos: 16, intervalMs: 90000 },  // 13-16 duos: 90s
    { maxDuos: 20, intervalMs: 120000 }, // 17-20 duos: 120s
  ]
  const LINEAR_MS_PER_DUO = 7500 // For 21+ duos
  const BASE_INTERVAL_MS = 60000 // 1 minute fallback

  if (nbDuos === 0) {
    return BASE_INTERVAL_MS
  }

  // Check tier intervals
  for (const tier of TIER_INTERVALS) {
    if (nbDuos <= tier.maxDuos) {
      return tier.intervalMs
    }
  }

  // For 21+ duos, use linear scaling
  return nbDuos * LINEAR_MS_PER_DUO
}

/**
 * Calculate estimated API calls per minute
 */
function calculateApiCallsPerMin(nbDuos: number, intervalMs: number): number {
  if (nbDuos === 0) return 0
  // 2 getRecentMatchIds calls per duo per poll
  const callsPerPoll = nbDuos * 2
  const pollsPerMinute = 60000 / intervalMs
  return callsPerPoll * pollsPerMinute
}

describe('AutoPollService - Dynamic Interval', () => {
  describe('calculateInterval', () => {
    it('should return base interval when no duos', () => {
      expect(calculateInterval(0)).toBe(60000) // 60s
    })

    it('should use tier 1 (30s) for 1-4 duos', () => {
      expect(calculateInterval(1)).toBe(30000) // 30s
      expect(calculateInterval(2)).toBe(30000) // 30s
      expect(calculateInterval(3)).toBe(30000) // 30s
      expect(calculateInterval(4)).toBe(30000) // 30s
    })

    it('should use tier 2 (45s) for 5-8 duos', () => {
      expect(calculateInterval(5)).toBe(45000) // 45s
      expect(calculateInterval(6)).toBe(45000) // 45s
      expect(calculateInterval(7)).toBe(45000) // 45s
      expect(calculateInterval(8)).toBe(45000) // 45s
    })

    it('should use tier 3 (60s) for 9-12 duos', () => {
      expect(calculateInterval(9)).toBe(60000) // 60s
      expect(calculateInterval(10)).toBe(60000) // 60s
      expect(calculateInterval(11)).toBe(60000) // 60s
      expect(calculateInterval(12)).toBe(60000) // 60s
    })

    it('should use tier 4 (90s) for 13-16 duos', () => {
      expect(calculateInterval(13)).toBe(90000) // 90s
      expect(calculateInterval(14)).toBe(90000) // 90s
      expect(calculateInterval(15)).toBe(90000) // 90s
      expect(calculateInterval(16)).toBe(90000) // 90s
    })

    it('should use tier 5 (120s) for 17-20 duos', () => {
      expect(calculateInterval(17)).toBe(120000) // 120s
      expect(calculateInterval(18)).toBe(120000) // 120s
      expect(calculateInterval(19)).toBe(120000) // 120s
      expect(calculateInterval(20)).toBe(120000) // 120s
    })

    it('should scale linearly for 21+ duos', () => {
      expect(calculateInterval(21)).toBe(157500) // 21 * 7.5s
      expect(calculateInterval(25)).toBe(187500) // 25 * 7.5s
      expect(calculateInterval(30)).toBe(225000) // 30 * 7.5s
    })

    it('should handle large number of duos', () => {
      expect(calculateInterval(30)).toBe(225000) // 225s = 3min45s
      expect(calculateInterval(50)).toBe(375000) // 375s = 6min15s
    })
  })

  describe('API Rate Limiting', () => {
    const RIOT_LIMIT_PER_MIN = 50 // 100 calls / 2 minutes
    const SAFE_LIMIT_PER_MIN = 40 // 80% safety margin

    it('should stay under 80% rate limit for all duo counts', () => {
      const testCases = [1, 2, 5, 10, 15, 20, 25, 30]

      for (const nbDuos of testCases) {
        const interval = calculateInterval(nbDuos)
        const callsPerMin = calculateApiCallsPerMin(nbDuos, interval)

        expect(callsPerMin).toBeLessThanOrEqual(SAFE_LIMIT_PER_MIN)
      }
    })

    it('should calculate correct API calls for specific scenarios', () => {
      // 1 duo, 30s interval
      expect(calculateApiCallsPerMin(1, 30000)).toBeCloseTo(4, 1)

      // 5 duos, 37.5s interval
      expect(calculateApiCallsPerMin(5, 37500)).toBeCloseTo(16, 1)

      // 10 duos, 75s interval
      expect(calculateApiCallsPerMin(10, 75000)).toBeCloseTo(16, 1)

      // 20 duos, 150s interval
      expect(calculateApiCallsPerMin(20, 150000)).toBeCloseTo(16, 1)
    })

    it('should never exceed Riot API limit', () => {
      // Test extreme case: 100 duos
      const interval = calculateInterval(100)
      const callsPerMin = calculateApiCallsPerMin(100, interval)

      expect(callsPerMin).toBeLessThanOrEqual(RIOT_LIMIT_PER_MIN)
    })
  })

  describe('Interval Adjustment Logic', () => {
    function shouldAdjustInterval(oldInterval: number, newInterval: number): boolean {
      const difference = Math.abs(newInterval - oldInterval)
      const threshold = oldInterval * 0.1 // 10% threshold
      return difference > threshold
    }

    it('should not adjust for small changes (<10%)', () => {
      expect(shouldAdjustInterval(30000, 32000)).toBe(false) // +6.7%
      expect(shouldAdjustInterval(60000, 65000)).toBe(false) // +8.3%
    })

    it('should adjust for tier changes (>10%)', () => {
      expect(shouldAdjustInterval(30000, 45000)).toBe(true) // +50% (tier 1→2)
      expect(shouldAdjustInterval(45000, 60000)).toBe(true) // +33% (tier 2→3)
      expect(shouldAdjustInterval(60000, 90000)).toBe(true) // +50% (tier 3→4)
      expect(shouldAdjustInterval(90000, 120000)).toBe(true) // +33% (tier 4→5)
    })
  })

  describe('Real-world Scenarios', () => {
    it('small friend group (2-3 duos)', () => {
      const intervals = [
        { duos: 2, expected: 30000 },
        { duos: 3, expected: 30000 },
      ]

      for (const { duos, expected } of intervals) {
        const interval = calculateInterval(duos)
        expect(interval).toBe(expected)

        const callsPerMin = calculateApiCallsPerMin(duos, interval)
        expect(callsPerMin).toBeLessThan(20) // Very safe
      }
    })

    it('medium challenge (6-10 duos)', () => {
      const intervals = [
        { duos: 6, expected: 45000 },  // Tier 2
        { duos: 10, expected: 60000 }, // Tier 3
      ]

      for (const { duos, expected } of intervals) {
        const interval = calculateInterval(duos)
        expect(interval).toBe(expected)

        const callsPerMin = calculateApiCallsPerMin(duos, interval)
        expect(callsPerMin).toBeGreaterThan(10)
        expect(callsPerMin).toBeLessThan(30)
      }
    })

    it('large challenge (15-20 duos)', () => {
      const intervals = [
        { duos: 15, expected: 90000 },  // Tier 4
        { duos: 20, expected: 120000 }, // Tier 5
      ]

      for (const { duos, expected } of intervals) {
        const interval = calculateInterval(duos)
        expect(interval).toBe(expected)

        const callsPerMin = calculateApiCallsPerMin(duos, interval)
        expect(callsPerMin).toBeLessThan(30) // Safe margin
      }
    })

    it('very large challenge (25+ duos)', () => {
      const intervals = [
        { duos: 25, expected: 187500 }, // Linear
        { duos: 30, expected: 225000 }, // Linear
      ]

      for (const { duos, expected } of intervals) {
        const interval = calculateInterval(duos)
        expect(interval).toBe(expected)

        const callsPerMin = calculateApiCallsPerMin(duos, interval)
        expect(callsPerMin).toBeLessThan(40) // Safe margin
      }
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero duos', () => {
      const interval = calculateInterval(0)
      expect(interval).toBeGreaterThan(0)
      expect(calculateApiCallsPerMin(0, interval)).toBe(0)
    })

    it('should handle single duo', () => {
      const interval = calculateInterval(1)
      expect(interval).toBe(30000) // Minimum
    })

    it('should handle very large number of duos', () => {
      const interval = calculateInterval(1000)
      expect(interval).toBeGreaterThan(0)
      expect(interval).toBe(1000 * 7500) // 7,500,000ms = 2h5min
    })
  })

  describe('Documentation Examples', () => {
    it('should match documented tiered examples', () => {
      const examples = [
        { duos: 1, interval: 30000, calls: 4 },    // Tier 1
        { duos: 4, interval: 30000, calls: 16 },   // Tier 1
        { duos: 5, interval: 45000, calls: 13 },   // Tier 2
        { duos: 8, interval: 45000, calls: 21 },   // Tier 2
        { duos: 10, interval: 60000, calls: 20 },  // Tier 3
        { duos: 12, interval: 60000, calls: 24 },  // Tier 3
        { duos: 15, interval: 90000, calls: 20 },  // Tier 4
        { duos: 20, interval: 120000, calls: 20 }, // Tier 5
        { duos: 25, interval: 187500, calls: 16 }, // Linear
      ]

      for (const { duos, interval: expectedInterval, calls: expectedCalls } of examples) {
        const interval = calculateInterval(duos)
        expect(interval).toBe(expectedInterval)

        const calls = calculateApiCallsPerMin(duos, interval)
        expect(calls).toBeCloseTo(expectedCalls, 0)
      }
    })
  })
})
