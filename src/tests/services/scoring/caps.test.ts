/**
 * Tests pour les plafonds (caps)
 * Formules (SPECIFICATIONS.md v2.1 - Section 7):
 *
 * Par joueur / game:
 * - Minimum: -25 points
 * - Maximum: +70 points
 *
 * Par duo / game:
 * - Minimum: -50 points
 * - Maximum: +120 points
 */

import { describe, it, expect } from 'vitest'
import { applyPlayerCap, applyDuoCap } from '../../../services/scoring/caps.js'

describe('applyPlayerCap', () => {
  describe('Within range', () => {
    it('should not change score within range', () => {
      expect(applyPlayerCap(0)).toBe(0)
      expect(applyPlayerCap(25)).toBe(25)
      expect(applyPlayerCap(50)).toBe(50)
      expect(applyPlayerCap(-10)).toBe(-10)
      expect(applyPlayerCap(-20)).toBe(-20)
    })

    it('should preserve exact min/max values', () => {
      expect(applyPlayerCap(-25)).toBe(-25)
      expect(applyPlayerCap(70)).toBe(70)
    })
  })

  describe('Above maximum', () => {
    it('should cap to +70 when above', () => {
      expect(applyPlayerCap(71)).toBe(70)
      expect(applyPlayerCap(100)).toBe(70)
      expect(applyPlayerCap(150)).toBe(70)
      expect(applyPlayerCap(1000)).toBe(70)
    })
  })

  describe('Below minimum', () => {
    it('should cap to -25 when below', () => {
      expect(applyPlayerCap(-26)).toBe(-25)
      expect(applyPlayerCap(-50)).toBe(-25)
      expect(applyPlayerCap(-100)).toBe(-25)
      expect(applyPlayerCap(-1000)).toBe(-25)
    })
  })

  describe('Edge cases', () => {
    it('should handle decimal values (before rounding)', () => {
      expect(applyPlayerCap(69.8)).toBe(69.8)
      expect(applyPlayerCap(70.2)).toBe(70)
      expect(applyPlayerCap(-24.5)).toBe(-24.5)
      expect(applyPlayerCap(-25.5)).toBe(-25)
    })
  })
})

describe('applyDuoCap', () => {
  describe('Within range', () => {
    it('should not change score within range', () => {
      expect(applyDuoCap(0)).toBe(0)
      expect(applyDuoCap(50)).toBe(50)
      expect(applyDuoCap(100)).toBe(100)
      expect(applyDuoCap(-25)).toBe(-25)
      expect(applyDuoCap(-40)).toBe(-40)
    })

    it('should preserve exact min/max values', () => {
      expect(applyDuoCap(-50)).toBe(-50)
      expect(applyDuoCap(120)).toBe(120)
    })
  })

  describe('Above maximum', () => {
    it('should cap to +120 when above', () => {
      expect(applyDuoCap(121)).toBe(120)
      expect(applyDuoCap(150)).toBe(120)
      expect(applyDuoCap(200)).toBe(120)
      expect(applyDuoCap(1000)).toBe(120)
    })
  })

  describe('Below minimum', () => {
    it('should cap to -50 when below', () => {
      expect(applyDuoCap(-51)).toBe(-50)
      expect(applyDuoCap(-75)).toBe(-50)
      expect(applyDuoCap(-100)).toBe(-50)
      expect(applyDuoCap(-1000)).toBe(-50)
    })
  })

  describe('Edge cases', () => {
    it('should handle decimal values', () => {
      expect(applyDuoCap(119.5)).toBe(119.5)
      expect(applyDuoCap(120.5)).toBe(120)
      expect(applyDuoCap(-49.5)).toBe(-49.5)
      expect(applyDuoCap(-50.5)).toBe(-50)
    })
  })
})

describe('Spec scenarios', () => {
  it('player with very high KDA should be capped to +70', () => {
    const uncapped = 95 // Noob avec 20/0/30 par exemple
    const capped = applyPlayerCap(uncapped)
    expect(capped).toBe(70)
  })

  it('player who fed hard should be capped to -25', () => {
    const uncapped = -45 // Carry qui feed avec 0/15/2
    const capped = applyPlayerCap(uncapped)
    expect(capped).toBe(-25)
  })

  it('duo with both players at max should be capped', () => {
    const player1 = applyPlayerCap(80) // → 70
    const player2 = applyPlayerCap(90) // → 70
    const duoSum = player1 + player2 // 140
    const duoCapped = applyDuoCap(duoSum)

    expect(duoCapped).toBe(120) // Capped at duo level
  })

  it('duo with both players feeding should be capped', () => {
    const player1 = applyPlayerCap(-40) // → -25
    const player2 = applyPlayerCap(-35) // → -25
    const duoSum = player1 + player2 // -50
    const duoCapped = applyDuoCap(duoSum)

    expect(duoCapped).toBe(-50) // Already at cap
  })
})
