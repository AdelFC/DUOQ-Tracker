/**
 * Tests pour le Scoring Engine complet
 * Teste l'orchestration de tous les modules selon l'ordre strict
 */

import { describe, it, expect } from 'vitest'
import { calculateGameScore } from '../../../services/scoring/engine.js'
import { gameData, playerStats } from '../../fixtures/builders.js'
import type { PlayerGameStats } from '../../../types/game.js'
import type { RankInfo } from '../../../types/player.js'

describe('calculateGameScore', () => {
  describe('Spec example (Section 8)', () => {
    it('should match the spec example calculation', () => {
      // Setup from SPECIFICATIONS.md Section 8
      // Noob: 10K/3D/15A, off-role + off-champion, 3rd win, Bronze I → Silver IV
      // Carry: 8K/5D/20A, on-role + on-champion, no streak, Gold III stable
      // Game: Win in 22 minutes

      const noobPrevRank: RankInfo = { tier: 'BRONZE', division: 'I', lp: 95 }
      const noobNewRank: RankInfo = { tier: 'SILVER', division: 'IV', lp: 0 }

      const carryRank: RankInfo = { tier: 'GOLD', division: 'III', lp: 50 }

      const noobGameStats: PlayerGameStats = {
        puuid: 'noob_puuid',
        summonerId: 'noob_summoner',
        teamId: 100,
        championId: 157, // Yasuo
        championName: 'Yasuo',
        lane: 'MIDDLE',
        kills: 10,
        deaths: 3,
        assists: 15,
        previousRank: noobPrevRank,
        newRank: noobNewRank,
        peakElo: 'S4', // Peak = Silver 4 (à son niveau, pas de smurf)
        isOffRole: true, // MID au lieu de TOP
        isOffChampion: true, // Yasuo au lieu de Garen
      }

      const carryGameStats: PlayerGameStats = {
        puuid: 'carry_puuid',
        summonerId: 'carry_summoner',
        teamId: 100,
        championId: 222, // Jinx
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 8,
        deaths: 5,
        assists: 20,
        previousRank: carryRank,
        newRank: carryRank, // Stable
        peakElo: 'G3', // Peak = Gold 3 (à son niveau, pas de smurf)
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .withDuo(1)
        .asVictory()
        .withDuration(1320) // 22 minutes = 1320 secondes
        .withNoobStats(noobGameStats)
        .withCarryStats(carryGameStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 2, // 2 wins avant → cette game atteint 3
        carryStreak: 0, // Pas de streak
      })

      // ─────────────────────────────────────────────────────────
      // NOOB CALCULATION
      // ─────────────────────────────────────────────────────────

      // 1. P_KDA = P_base + bonus
      //    P_base = 10 + 7.5 - 3 = 14.5
      //    Bonus = 0.5*10 + 0.25*15 = 5 + 3.75 = 8.75
      //    Total = 23.25
      expect(result.noob.kda.base).toBeCloseTo(14.5, 2)
      expect(result.noob.kda.roleAdjustment).toBeCloseTo(8.75, 2)
      expect(result.noob.kda.final).toBeCloseTo(23.25, 2)

      // 2. Game result = Win <25min = +8
      expect(result.noob.gameResult.final).toBe(8)

      // 3. Streak = 3rd win = +10
      // NOTE: calculateStreakBonus(true, 2) → 3ème win → +10

      // 4. Rank change = Bronze I → Silver IV = +100
      expect(result.noob.rankChange.tierBonus).toBe(100)

      // 5. Special bonuses (MVP) = 0 (not implemented)

      // 6. Subtotal = 23.25 + 8 + 10 + 100 = 141.25
      const noobExpectedSubtotal = 23.25 + 8 + 10 + 100
      expect(result.noob.subtotal).toBeCloseTo(noobExpectedSubtotal, 2)

      // 7. Capped = min(70, 141.25) = 70
      expect(result.noob.capped).toBe(70)

      // 8. Rounded = 70
      expect(result.noob.final).toBe(70)

      // ─────────────────────────────────────────────────────────
      // CARRY CALCULATION
      // ─────────────────────────────────────────────────────────

      // 1. P_KDA = P_base + malus
      //    P_base = 8 + 10 - 5 = 13
      //    Malus = -0.5*5 = -2.5
      //    Total = 10.5
      expect(result.carry.kda.base).toBeCloseTo(13, 2)
      expect(result.carry.kda.roleAdjustment).toBeCloseTo(-2.5, 2)
      expect(result.carry.kda.final).toBeCloseTo(10.5, 2)

      // 2. Game result = Win <25min = +8
      expect(result.carry.gameResult.final).toBe(8)

      // 3. Streak = 0 (no streak)
      // calculateStreakBonus(true, 0) → 1st win → 0

      // 4. Rank change = stable = 0
      expect(result.carry.rankChange.tierBonus).toBe(0)

      // 5. Special bonuses = 0

      // 6. Subtotal = 10.5 + 8 + 0 + 0 = 18.5
      const carryExpectedSubtotal = 10.5 + 8 + 0 + 0
      expect(result.carry.subtotal).toBeCloseTo(carryExpectedSubtotal, 2)

      // 7. Capped = 18.5 (within range)
      expect(result.carry.capped).toBeCloseTo(18.5, 2)

      // 8. Rounded = 19 (0.5 rounds up)
      expect(result.carry.final).toBe(19)

      // ─────────────────────────────────────────────────────────
      // DUO CALCULATION
      // ─────────────────────────────────────────────────────────

      // 9. Sum = 70 + 19 = 89
      expect(result.duo.sum).toBe(89)

      // 10. Risk bonus = H=2 (noob off-role + off-champion) = +5
      expect(result.duo.riskBonus.final).toBe(5)

      // 11. No-death bonus = 0 (3 deaths + 5 deaths)
      expect(result.duo.noDeathBonus).toBe(0)

      // 12. Subtotal = 89 + 5 + 0 = 94
      expect(result.duo.subtotal).toBe(94)

      // 13. Capped = 94 (within range)
      expect(result.duo.capped).toBe(94)

      // 14. Final = 94
      expect(result.duo.final).toBe(94)
      expect(result.total).toBe(94)
    })
  })

  describe('Perfect game (both no deaths)', () => {
    it('should award no-death bonus', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 15,
        deaths: 0, // Perfect
        assists: 20,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 12,
        deaths: 0, // Perfect
        assists: 18,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1800)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Should have no-death bonus
      expect(result.duo.noDeathBonus).toBe(20)
    })
  })

  describe('High risk game (H=4)', () => {
    it('should award max risk bonus', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 5,
        deaths: 2,
        assists: 10,
        previousRank: rank,
        newRank: rank,
        isOffRole: true,
        isOffChampion: true,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 8,
        deaths: 3,
        assists: 12,
        previousRank: rank,
        newRank: rank,
        isOffRole: true,
        isOffChampion: true,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1800)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // H = 4 → +25 points
      expect(result.duo.riskBonus.final).toBe(25)
    })
  })

  describe('Duo feeding hard (caps)', () => {
    it('should apply duo cap when both players feed', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 0,
        deaths: 20, // Extreme feeding
        assists: 0,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 0,
        deaths: 18, // Extreme feeding
        assists: 2,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asDefeat()
        .withDuration(1800)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Both should hit player cap (-25)
      expect(result.noob.capped).toBe(-25)
      expect(result.carry.capped).toBe(-25)

      // Duo sum = -25 + -25 = -50
      expect(result.duo.sum).toBe(-50)

      // Should hit duo cap (-50)
      expect(result.duo.capped).toBe(-50)
      expect(result.total).toBe(-50)
    })
  })

  describe('Edge cases', () => {
    it('should handle normal victory', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 5,
        deaths: 2,
        assists: 8,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 7,
        deaths: 3,
        assists: 10,
        previousRank: rank,
        newRank: rank,
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1800)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Should have positive scores
      expect(result.total).toBeGreaterThan(0)
    })
  })
})
