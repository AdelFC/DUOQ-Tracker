/**
 * Tests for game-embeds.ts
 */

import { describe, it, expect } from 'vitest'
import {
  gameDetectedEmbed,
  gameEndedEmbed,
  pointsBreakdownEmbed,
  rankChangeEmbed,
  ladderEmbed,
  dailyLadderEmbed,
} from '../../formatters/game-embeds'
import { Colors } from '../../formatters/base-embeds'

describe('Game Embeds', () => {
  describe('gameDetectedEmbed', () => {
    it('should create a game detected notification', () => {
      const result = gameDetectedEmbed('Dream Team', 'NoobPlayer', 'CarryPlayer', 'EUW1_123456789')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('🎮 Game détectée !')
      expect(parsed.description).toContain('Dream Team')
      expect(parsed.color).toBe(Colors.INFO)
      expect(parsed.fields).toHaveLength(2)
      expect(parsed.fields[0].name).toBe('👥 Duo')
      expect(parsed.fields[0].value).toContain('NoobPlayer')
      expect(parsed.fields[0].value).toContain('CarryPlayer')
      expect(parsed.fields[1].name).toBe('🔍 Match ID')
      expect(parsed.fields[1].value).toContain('EUW1_123456789')
      expect(parsed.footer.text).toBe('Bonne chance ! 🍀')
    })
  })

  describe('gameEndedEmbed', () => {
    it('should create a victory notification with green color', () => {
      const result = gameEndedEmbed(
        'Dream Team',
        'NoobPlayer',
        'CarryPlayer',
        true, // win
        { kills: 10, deaths: 2, assists: 15 },
        { kills: 8, deaths: 3, assists: 20 },
        120, // points
        1800, // 30 minutes
        'EUW1_123456789'
      )
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('🏆 VICTOIRE')
      expect(parsed.description).toContain('Dream Team')
      expect(parsed.color).toBe(Colors.GAME_WIN)
      expect(parsed.fields).toHaveLength(5)
      expect(parsed.footer.text).toContain('EUW1_123456789')
    })

    it('should create a defeat notification with red color', () => {
      const result = gameEndedEmbed(
        'Dream Team',
        'NoobPlayer',
        'CarryPlayer',
        false, // loss
        { kills: 3, deaths: 8, assists: 5 },
        { kills: 5, deaths: 6, assists: 10 },
        -50,
        1500,
        'EUW1_123456789'
      )
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('💀 DÉFAITE')
      expect(parsed.color).toBe(Colors.GAME_LOSS)
    })

    it('should calculate KDA correctly', () => {
      const result = gameEndedEmbed(
        'Duo',
        'Noob',
        'Carry',
        true,
        { kills: 10, deaths: 5, assists: 15 }, // (10+15)/5 = 5.00
        { kills: 8, deaths: 2, assists: 12 }, // (8+12)/2 = 10.00
        100,
        1800,
        'match123'
      )
      const parsed = JSON.parse(result)

      const noobField = parsed.fields.find((f: any) => f.name.includes('Noob'))
      const carryField = parsed.fields.find((f: any) => f.name.includes('Carry'))

      expect(noobField.value).toContain('5.00')
      expect(carryField.value).toContain('10.00')
    })

    it('should show "Perfect" KDA when deaths = 0', () => {
      const result = gameEndedEmbed(
        'Duo',
        'Noob',
        'Carry',
        true,
        { kills: 10, deaths: 0, assists: 15 },
        { kills: 8, deaths: 0, assists: 12 },
        150,
        1800,
        'match123'
      )
      const parsed = JSON.parse(result)

      const noobField = parsed.fields.find((f: any) => f.name.includes('Noob'))
      const carryField = parsed.fields.find((f: any) => f.name.includes('Carry'))

      expect(noobField.value).toContain('Perfect')
      expect(carryField.value).toContain('Perfect')
    })

    it('should format game duration correctly', () => {
      const result = gameEndedEmbed(
        'Duo',
        'Noob',
        'Carry',
        true,
        { kills: 10, deaths: 2, assists: 15 },
        { kills: 8, deaths: 3, assists: 20 },
        100,
        1845, // 30 minutes 45 seconds
        'match123'
      )
      const parsed = JSON.parse(result)

      const durationField = parsed.fields.find((f: any) => f.name === '⏱️ Durée')
      expect(durationField.value).toBe('30m 45s')
    })
  })

  describe('pointsBreakdownEmbed', () => {
    it('should create a points breakdown embed', () => {
      const result = pointsBreakdownEmbed(100, 20, 15, 10, 1.5, 217)
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('📊 Détail des Points')
      expect(parsed.color).toBe(Colors.INFO)
      expect(parsed.fields).toHaveLength(6)

      const totalField = parsed.fields.find((f: any) => f.name === '🎯 TOTAL')
      expect(totalField.value).toContain('+217 pts')
    })

    it('should handle negative base points', () => {
      const result = pointsBreakdownEmbed(-50, 0, 0, 0, 1.0, -50)
      const parsed = JSON.parse(result)

      const baseField = parsed.fields.find((f: any) => f.name === '⚡ Points de base')
      expect(baseField.value).toBe('-50 pts')

      const totalField = parsed.fields.find((f: any) => f.name === '🎯 TOTAL')
      expect(totalField.value).toContain('-50 pts')
    })
  })

  describe('rankChangeEmbed', () => {
    it('should create a promotion notification', () => {
      const result = rankChangeEmbed('TestPlayer', 'GOLD III', 'GOLD II', true)
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('📈 PROMOTION !')
      expect(parsed.description).toContain('TestPlayer')
      expect(parsed.color).toBe(Colors.SUCCESS)
      expect(parsed.fields).toHaveLength(3)
      expect(parsed.fields[0].value).toBe('GOLD III')
      expect(parsed.fields[2].value).toContain('GOLD II')
    })

    it('should create a demotion notification', () => {
      const result = rankChangeEmbed('TestPlayer', 'GOLD III', 'GOLD IV', false)
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('📉 Demotion')
      expect(parsed.color).toBe(Colors.ERROR)
    })
  })

  describe('ladderEmbed', () => {
    it('should create a ladder with multiple duos', () => {
      const duos = [
        {
          rank: 1,
          duoName: 'Dream Team',
          noobName: 'Noob1',
          carryName: 'Carry1',
          totalPoints: 500,
          wins: 25,
          losses: 10,
        },
        {
          rank: 2,
          duoName: 'Team 2',
          noobName: 'Noob2',
          carryName: 'Carry2',
          totalPoints: 450,
          wins: 20,
          losses: 12,
        },
        {
          rank: 3,
          duoName: 'Team 3',
          noobName: 'Noob3',
          carryName: 'Carry3',
          totalPoints: 400,
          wins: 18,
          losses: 15,
        },
      ]

      const result = ladderEmbed(duos, 1, 1, 3)
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('🏆 Classement DUOQ')
      expect(parsed.color).toBe(Colors.INFO)
      expect(parsed.description).toContain('🥇')
      expect(parsed.description).toContain('🥈')
      expect(parsed.description).toContain('🥉')
      expect(parsed.description).toContain('Dream Team')
      expect(parsed.description).toContain('500')
      expect(parsed.footer.text).toBe('Page 1/1 • 3 duos')
    })

    it('should show empty ladder message when no duos', () => {
      const result = ladderEmbed([], 1, 1, 0)
      const parsed = JSON.parse(result)

      expect(parsed.description).toContain('Aucun duo inscrit')
      expect(parsed.description).toContain('/register')
    })

    it('should calculate winrate correctly', () => {
      const duos = [
        {
          rank: 1,
          duoName: 'Test Duo',
          noobName: 'Noob',
          carryName: 'Carry',
          totalPoints: 300,
          wins: 7,
          losses: 3, // 70% winrate
        },
      ]

      const result = ladderEmbed(duos, 1, 1, 1)
      const parsed = JSON.parse(result)

      expect(parsed.description).toContain('70%')
    })

    it('should show 0% winrate when no games played', () => {
      const duos = [
        {
          rank: 1,
          duoName: 'Test Duo',
          noobName: 'Noob',
          carryName: 'Carry',
          totalPoints: 0,
          wins: 0,
          losses: 0,
        },
      ]

      const result = ladderEmbed(duos, 1, 1, 1)
      const parsed = JSON.parse(result)

      expect(parsed.description).toContain('0%')
    })
  })

  describe('dailyLadderEmbed', () => {
    it('should create a daily ladder with top 5', () => {
      const duos = [
        {
          rank: 1,
          duoName: 'Dream Team',
          noobName: 'Noob1',
          carryName: 'Carry1',
          totalPoints: 500,
          wins: 25,
          losses: 10,
        },
        {
          rank: 2,
          duoName: 'Team 2',
          noobName: 'Noob2',
          carryName: 'Carry2',
          totalPoints: 450,
          wins: 20,
          losses: 12,
        },
      ]

      const date = new Date('2025-11-01T12:00:00Z')
      const result = dailyLadderEmbed(duos, 10, date)
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('🏆 Classement Quotidien DUOQ')
      expect(parsed.color).toBe(0xffd700) // Gold
      expect(parsed.description).toContain('Top 5 du jour')
      expect(parsed.description).toContain('Dream Team')
      expect(parsed.footer.text).toContain('10 duos')
      expect(parsed.timestamp).toBe('2025-11-01T12:00:00.000Z') // Serialized as ISO string
    })

    it('should limit to top 5 even if more duos provided', () => {
      const duos = Array.from({ length: 10 }, (_, i) => ({
        rank: i + 1,
        duoName: `Team ${i + 1}`,
        noobName: `Noob${i + 1}`,
        carryName: `Carry${i + 1}`,
        totalPoints: 500 - i * 50,
        wins: 20,
        losses: 10,
      }))

      const result = dailyLadderEmbed(duos, 10, new Date())
      const parsed = JSON.parse(result)

      // Should only contain first 5 teams
      expect(parsed.description).toContain('Team 1')
      expect(parsed.description).toContain('Team 5')
      expect(parsed.description).not.toContain('Team 6')
    })

    it('should show empty message when no duos', () => {
      const result = dailyLadderEmbed([], 0, new Date())
      const parsed = JSON.parse(result)

      expect(parsed.description).toContain('Aucun duo inscrit')
    })
  })
})
