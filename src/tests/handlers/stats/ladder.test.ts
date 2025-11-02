import { describe, it, expect, beforeEach } from 'vitest'
import { ladderHandler } from '../../../handlers/stats/ladder.handler'
import type { State } from '../../../types/state.js'
import type { Response, Message } from '../../../types/message.js'
import { MessageType } from '../../../types/message.js'

function createTestState(): State {
  return {
    players: new Map(),
    duos: new Map(),
    games: new Map(),
    devs: new Map(),
    config: {
      discordToken: 'test',
      guildId: 'test',
      adminRoleId: 'test',
      riotApiKey: 'test',
      region: 'EUW1',
      challengeStartDate: new Date(),
      challengeEndDate: new Date(),
      gameCheckInterval: 60000,
      maxGamesPerCheck: 10,
    },
  }
}

function createMessage(sourceId: string, payload: { page?: number } = {}): Message {
  return {
    type: MessageType.LADDER,
    sourceId,
    payload,
  }
}

describe('Handler Ladder', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait afficher le classement avec plusieurs duos', () => {
      // Setup: 3 duos avec différents scores
      // Duo 1: 150 pts, 10W-2L
      state.players.set('p1', {
        discordId: 'p1',
        gameName: 'Player1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'II', lp: 75 },
        totalPoints: 80,
        wins: 10,
        losses: 2,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        discordId: 'p2',
        gameName: 'Player2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'I', lp: 50 },
        totalPoints: 70,
        wins: 10,
        losses: 2,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 1,
        noobId: 'p1',
        carryId: 'p2',
        name: 'Les Zinzins',
        totalPoints: 150,
        wins: 10,
        losses: 2,
        createdAt: Date.now(),
      })

      // Duo 2: 100 pts, 8W-4L
      state.players.set('p3', {
        discordId: 'p3',
        gameName: 'Player3',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 2,
        initialRank: { tier: 'SILVER', division: 'I', lp: 80 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 20 },
        totalPoints: 55,
        wins: 8,
        losses: 4,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('p4', {
        discordId: 'p4',
        gameName: 'Player4',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 2,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 60 },
        totalPoints: 45,
        wins: 8,
        losses: 4,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo2', {
        duoId: 2,
        noobId: 'p3',
        carryId: 'p4',
        name: 'Les Pros',
        totalPoints: 100,
        wins: 8,
        losses: 4,
        createdAt: Date.now(),
      })

      // Duo 3: 50 pts, 5W-5L
      state.players.set('p5', {
        discordId: 'p5',
        gameName: 'Player5',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 3,
        initialRank: { tier: 'BRONZE', division: 'I', lp: 90 },
        currentRank: { tier: 'SILVER', division: 'IV', lp: 10 },
        totalPoints: 25,
        wins: 5,
        losses: 5,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('p6', {
        discordId: 'p6',
        gameName: 'Player6',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 3,
        initialRank: { tier: 'SILVER', division: 'III', lp: 40 },
        currentRank: { tier: 'SILVER', division: 'II', lp: 60 },
        totalPoints: 25,
        wins: 5,
        losses: 5,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo3', {
        duoId: 3,
        noobId: 'p5',
        carryId: 'p6',
        name: 'Les Noobs',
        totalPoints: 50,
        wins: 5,
        losses: 5,
        createdAt: Date.now(),
      })

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('user1')

      const content = responses[0].content
      const embed = JSON.parse(content)
      const description = embed.description

      // Vérifier l'ordre (classement décroissant)
      const zinzinsIndex = description.indexOf('Les Zinzins')
      const prosIndex = description.indexOf('Les Pros')
      const noobsIndex = description.indexOf('Les Noobs')

      expect(zinzinsIndex).toBeLessThan(prosIndex)
      expect(prosIndex).toBeLessThan(noobsIndex)

      // Vérifier les médailles
      expect(description).toContain('🥇') // 1er
      expect(description).toContain('🥈') // 2ème
      expect(description).toContain('🥉') // 3ème

      // Vérifier les scores
      expect(description).toContain('150') // duo1
      expect(description).toContain('10W/2L') // duo1
    })

    it('devrait afficher "Aucun duo" si le classement est vide', () => {
      // Aucun duo
      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('Aucun duo')
    })

    it('devrait gérer un seul duo', () => {
      // Setup: 1 seul duo
      state.players.set('p1', {
        discordId: 'p1',
        gameName: 'Player1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 30,
        wins: 3,
        losses: 1,
        winStreak: 2,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        discordId: 'p2',
        gameName: 'Player2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 30,
        wins: 3,
        losses: 1,
        winStreak: 2,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 1,
        noobId: 'p1',
        carryId: 'p2',
        name: 'Solo Duo',
        totalPoints: 60,
        wins: 3,
        losses: 1,
        createdAt: Date.now(),
      })

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('🥇')
      expect(embed.description).toContain('Solo Duo')
      expect(embed.description).toContain('60')
    })

    it('devrait afficher le format avec les noms de joueurs', () => {
      // Setup: 1 duo
      state.players.set('p1', {
        discordId: 'p1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 40,
        wins: 5,
        losses: 2,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        discordId: 'p2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 40,
        wins: 5,
        losses: 2,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 1,
        noobId: 'p1',
        carryId: 'p2',
        name: 'Test Duo',
        totalPoints: 80,
        wins: 5,
        losses: 2,
        createdAt: Date.now(),
      })

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Format: 🥇 Test Duo • 80 pts (5W/2L)
      //         └─ Noob 👥 Carry
      expect(embed.description).toContain('Test Duo')
      expect(embed.description).toContain('└─')
      expect(embed.description).toContain('Noob')
      expect(embed.description).toContain('👥')
      expect(embed.description).toContain('Carry')
    })

    it('devrait afficher le classement complet avec plus de 10 duos', () => {
      // Setup: 15 duos
      for (let i = 1; i <= 15; i++) {
        state.players.set(`p${i}a`, {
          userId: `p${i}a`,
          gameName: `Noob${i}`,
          tagLine: 'EUW',
          role: 'noob',
          duoId: `duo${i}`,
          initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
          currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
          totalPoints: 50 - i,
          wins: 5,
          losses: 2,
          winStreak: 0,
          createdAt: Date.now(),
        })

        state.players.set(`p${i}b`, {
          userId: `p${i}b`,
          gameName: `Carry${i}`,
          tagLine: 'EUW',
          role: 'carry',
          duoId: `duo${i}`,
          initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
          currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
          totalPoints: 50 - i,
          wins: 5,
          losses: 2,
          winStreak: 0,
          createdAt: Date.now(),
        })

        state.duos.set(`duo${i}`, {
          duoId: `duo${i}`,
          noobId: `p${i}a`,
          carryId: `p${i}b`,
          name: `Duo ${i}`,
          totalPoints: 100 - i * 2,
          wins: 5,
          losses: 2,
          createdAt: Date.now(),
        })
      }

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      // Vérifier que seuls les 10 premiers duos sont sur la page 1
      const content = responses[0].content
      const embed = JSON.parse(content)

      // Page 1 contient Duo 1 à Duo 10
      for (let i = 1; i <= 10; i++) {
        expect(embed.description).toContain(`Duo ${i}`)
      }

      // Duo 11-15 ne sont PAS sur la page 1
      for (let i = 11; i <= 15; i++) {
        expect(embed.description).not.toContain(`Duo ${i}`)
      }

      // Vérifier la pagination
      expect(embed.footer.text).toContain('Page 1/2')
      expect(embed.footer.text).toContain('15 duos')
    })
  })

  describe('Cas spéciaux', () => {
    it('devrait gérer les duos avec 0 points', () => {
      // Setup: duo avec 0 points (nouveau)
      state.players.set('p1', {
        discordId: 'p1',
        gameName: 'New1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        discordId: 'p2',
        gameName: 'New2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 1,
        noobId: 'p1',
        carryId: 'p2',
        name: 'Fresh Duo',
        totalPoints: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('Fresh Duo')
      expect(embed.description).toContain('**0** pts')
      expect(embed.description).toContain('0W/0L')
    })

    it('devrait gérer les duos avec points négatifs', () => {
      // Setup: duo avec points négatifs (feeding hard)
      state.players.set('p1', {
        discordId: 'p1',
        gameName: 'Feeder1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'SILVER', division: 'II', lp: 20 },
        totalPoints: -50,
        wins: 2,
        losses: 10,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        discordId: 'p2',
        gameName: 'Feeder2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 10 },
        totalPoints: -50,
        wins: 2,
        losses: 10,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 1,
        noobId: 'p1',
        carryId: 'p2',
        name: 'Feeders United',
        totalPoints: -100,
        wins: 2,
        losses: 10,
        createdAt: Date.now(),
      })

      const msg = createMessage('user1')
      ladderHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('Feeders United')
      expect(embed.description).toContain('-100')
    })
  })
})
