/**
 * Tests pour le Scoring Engine complet v3.0
 * Teste l'orchestration de tous les modules selon l'ordre strict
 */

import { describe, it, expect } from 'vitest'
import { calculateGameScore } from '../../../services/scoring/engine.js'
import { gameData } from '../../fixtures/builders.js'
import type { PlayerGameStats } from '../../../types/game.js'
import type { RankInfo } from '../../../types/player.js'

describe('calculateGameScore v3.0', () => {
  describe('Remake / Early game (< 5 min)', () => {
    it('should return 0 points for remake', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 0,
        deaths: 1,
        assists: 0,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 1,
        deaths: 0,
        assists: 0,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(180) // 3 minutes
        .withRemake()
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      expect(result.total).toBe(0)
      expect(result.isRemakeOrEarlyGame).toBe(true)
      expect(result.noob.final).toBe(0)
      expect(result.carry.final).toBe(0)
    })

    it('should return 0 points for game < 5 min', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 2,
        deaths: 3,
        assists: 1,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 1,
        deaths: 2,
        assists: 0,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asDefeat()
        .withDuration(250) // 4:10
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      expect(result.total).toBe(0)
      expect(result.isRemakeOrEarlyGame).toBe(true)
    })
  })

  describe('v3.0 Victory scenarios', () => {
    it('should award +25 for fast win (< 20 min)', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 10,
        deaths: 0,
        assists: 8,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 8,
        deaths: 0,
        assists: 12,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1100) // 18:20 (< 20 min)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Fast win = +25
      expect(result.noob.gameResult.final).toBe(25)
      expect(result.carry.gameResult.final).toBe(25)

      // No death bonus = +20
      expect(result.duo.noDeathBonus).toBe(20)
      expect(result.alerts).toContainEqual(expect.objectContaining({ type: 'no_death' }))
    })

    it('should award +20 for standard win (>= 20 min)', () => {
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
        peakElo: 'G4',
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
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1800) // 30 minutes
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Standard win = +20
      expect(result.noob.gameResult.final).toBe(20)
      expect(result.carry.gameResult.final).toBe(20)
    })
  })

  describe('v3.0 Defeat scenarios', () => {
    it('should award -30 for surrender', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 3,
        deaths: 8,
        assists: 5,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 4,
        deaths: 6,
        assists: 7,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asDefeat()
        .withDuration(1350) // 22:30
        .withSurrender()
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 0,
        carryStreak: 0,
      })

      // Surrender = -30
      expect(result.noob.gameResult.final).toBe(-30)
      expect(result.carry.gameResult.final).toBe(-30)
      expect(result.alerts).toContainEqual(expect.objectContaining({ type: 'surrender' }))
    })

    it('should award -20 for standard loss', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 5,
        deaths: 6,
        assists: 4,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 6,
        deaths: 5,
        assists: 8,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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

      // Standard loss = -20
      expect(result.noob.gameResult.final).toBe(-20)
      expect(result.carry.gameResult.final).toBe(-20)
    })
  })

  describe('v3.0 Streak system (progressive + milestone)', () => {
    it('should award progressive + milestone at 3rd win', () => {
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
        peakElo: 'G4',
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
        peakElo: 'G4',
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
        noobStreak: 2, // 2 wins before → 3rd win
        carryStreak: 2,
      })

      // At 3rd win: progressive +3, milestone +10 = +13 total
      expect(result.noob.streak.progressive).toBe(3)
      expect(result.noob.streak.milestone).toBe(10)
      expect(result.noob.streak.total).toBe(13)

      expect(result.carry.streak.progressive).toBe(3)
      expect(result.carry.streak.milestone).toBe(10)
      expect(result.carry.streak.total).toBe(13)
    })

    it('should award progressive + milestone at 5th win', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 8,
        deaths: 1,
        assists: 10,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        kills: 10,
        deaths: 2,
        assists: 15,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        noobStreak: 4, // 4 wins before → 5th win
        carryStreak: 4,
      })

      // At 5th win: progressive +5, milestone +20 = +25 total
      expect(result.noob.streak.progressive).toBe(5)
      expect(result.noob.streak.milestone).toBe(20)
      expect(result.noob.streak.total).toBe(25)
    })
  })

  describe('v3.0 Caps', () => {
    it('should apply individual cap at +60', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 20, // Extreme score
        deaths: 0,
        assists: 20,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
        pentaKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 10,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 18,
        deaths: 0,
        assists: 25,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1100) // Fast win
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 6, // High streak
        carryStreak: 6,
      })

      // Should cap at +60
      expect(result.noob.capped).toBe(60)
    })

    it('should apply individual cap at -40', () => {
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
        peakElo: 'G4',
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
        deaths: 18,
        assists: 2,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        noobStreak: -4, // Loss streak
        carryStreak: -4,
      })

      // Should cap at -40
      expect(result.noob.capped).toBe(-40)
      expect(result.carry.capped).toBe(-40)
    })

    it('should apply duo cap at +120', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 20,
        deaths: 0,
        assists: 20,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: true,
        isOffChampion: true,
        pentaKills: 1,
        firstBloodKill: true,
        largestKillingSpree: 15,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 18,
        deaths: 0,
        assists: 25,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: true,
        isOffChampion: true,
      }

      const game = gameData()
        .asVictory()
        .withDuration(1100)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: 6,
        carryStreak: 6,
      })

      // Duo should cap at +120
      expect(result.duo.capped).toBe(120)
      expect(result.total).toBe(120)
    })

    it('should apply duo cap at -70', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 0,
        deaths: 25,
        assists: 0,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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
        deaths: 22,
        assists: 1,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
      }

      const game = gameData()
        .asDefeat()
        .withSurrender()
        .withDuration(1500)
        .withNoobStats(noobStats)
        .withCarryStats(carryStats)
        .build()

      const result = calculateGameScore({
        gameData: game,
        noobStreak: -4,
        carryStreak: -4,
      })

      // Duo should cap at -70
      expect(result.duo.capped).toBe(-70)
      expect(result.total).toBe(-70)
    })
  })

  describe('v3.0 Risk bonus', () => {
    it('should award +15 for H=4', () => {
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
        peakElo: 'G4',
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
        peakElo: 'G4',
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

      // H = 4 → +15 (v3.0)
      expect(result.duo.riskBonus.final).toBe(15)
    })

    it('should award +10 for H=3', () => {
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
        peakElo: 'G4',
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
        peakElo: 'G4',
        isOffRole: true,
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

      // H = 3 → +10 (v3.0)
      expect(result.duo.riskBonus.final).toBe(10)
    })

    it('should award 0 for H<=2', () => {
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
        peakElo: 'G4',
        isOffRole: true,
        isOffChampion: false,
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
        peakElo: 'G4',
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

      // H = 1 → 0 (v3.0)
      expect(result.duo.riskBonus.final).toBe(0)
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
        peakElo: 'G4',
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
        peakElo: 'G4',
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
      expect(result.alerts).toContainEqual(expect.objectContaining({ type: 'no_death' }))
    })
  })

  describe('Pentakill alert', () => {
    it('should trigger pentakill alert', () => {
      const rank: RankInfo = { tier: 'GOLD', division: 'IV', lp: 50 }

      const noobStats: PlayerGameStats = {
        puuid: 'n',
        summonerId: 'n',
        teamId: 100,
        championId: 1,
        championName: 'Annie',
        lane: 'MIDDLE',
        kills: 20,
        deaths: 1,
        assists: 10,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
        isOffRole: false,
        isOffChampion: false,
        pentaKills: 1,
      }

      const carryStats: PlayerGameStats = {
        puuid: 'c',
        summonerId: 'c',
        teamId: 100,
        championId: 222,
        championName: 'Jinx',
        lane: 'BOTTOM',
        kills: 8,
        deaths: 2,
        assists: 15,
        previousRank: rank,
        newRank: rank,
        peakElo: 'G4',
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

      expect(result.noob.specialBonuses.pentakill).toBe(30)
      expect(result.alerts).toContainEqual(
        expect.objectContaining({ type: 'pentakill', player: 'noob' })
      )
    })
  })
})
