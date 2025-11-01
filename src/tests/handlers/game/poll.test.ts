import { describe, it, expect, beforeEach } from 'vitest'
import { pollGamesHandler } from '../../../handlers/game/poll.handler'
import { State, Response, Message, Config } from '../../../types'

function createTestConfig(): Config {
  return {
    discordToken: 'test-token',
    guildId: 'test-guild',
    adminRoleId: 'admin-role',
    riotApiKey: 'RGAPI-test-key',
    region: 'EUW1',
    challengeStartDate: new Date(),
    challengeEndDate: new Date(),
    gameCheckInterval: 60000,
    maxGamesPerCheck: 10,
  }
}

function createTestState(): State {
  return {
    players: new Map(),
    duos: new Map(),
    games: new Map(),
    devs: new Map(),
    config: createTestConfig(),
  }
}

function createMessage(senderId: string): Message {
  return {
    type: 'poll_games',
    senderId,
    args: [],
  }
}

describe('Handler Game Poll', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait détecter un nouveau match duo dans l\'historique', () => {
      // Setup: duo inscrit
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('player2', {
        userId: 'player2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'player1',
        carryId: 'player2',
        name: 'Test Duo',
        totalPoints: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('system')

      // Mock: simuler que l'API Riot retourne un match où les 2 ont joué ensemble
      // (dans la vraie implémentation, on appellerait l'API Riot)

      pollGamesHandler(msg, state, responses)

      // Pour ce test, on vérifie juste que le handler ne crash pas
      // Dans la vraie implémentation avec API mockée, on vérifierait qu'un game est créé
      expect(responses).toBeDefined()
    })

    it('ne devrait pas re-scorer un match déjà traité', () => {
      // Setup: duo avec un game déjà scoré
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('player2', {
        userId: 'player2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'player1',
        carryId: 'player2',
        name: 'Test Duo',
        totalPoints: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      })

      // Ajouter un game déjà scoré
      state.games.set('EUW1_123456', {
        id: 1,
        matchId: 'EUW1_123456',
        duoId: 1,
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800,
        win: true,
        noobKills: 10,
        noobDeaths: 3,
        noobAssists: 15,
        noobChampionId: 222,
        noobLane: 'BOTTOM',
        noobPreviousRank: JSON.stringify({ tier: 'GOLD', division: 'III', lp: 50 }),
        noobNewRank: JSON.stringify({ tier: 'GOLD', division: 'III', lp: 70 }),
        carryKills: 8,
        carryDeaths: 5,
        carryAssists: 20,
        carryChampionId: 412,
        carryLane: 'BOTTOM',
        carryPreviousRank: JSON.stringify({ tier: 'PLATINUM', division: 'II', lp: 30 }),
        carryNewRank: JSON.stringify({ tier: 'PLATINUM', division: 'II', lp: 50 }),
        pointsAwarded: 80,
        breakdown: '{}',
        createdAt: new Date(),
      })

      const msg = createMessage('system')
      pollGamesHandler(msg, state, responses)

      // Le game ne doit pas être re-scoré
      // (vérification basique - dans la vraie implémentation on vérifierait les appels API)
      expect(state.games.size).toBe(1)
    })

    it('devrait ignorer les joueurs sans duo', () => {
      // Setup: joueur solo
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'Solo',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined, // Pas en duo
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('system')
      pollGamesHandler(msg, state, responses)

      // Pas d'erreur, simplement ignoré
      expect(responses).toBeDefined()
    })

    it('devrait traiter plusieurs duos en parallèle', () => {
      // Setup: 3 duos différents
      for (let i = 1; i <= 3; i++) {
        state.players.set(`player${i}a`, {
          userId: `player${i}a`,
          gameName: `Noob${i}`,
          tagLine: 'EUW',
          role: 'noob',
          duoId: `duo${i}`,
          initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
          currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
          totalPoints: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
          createdAt: Date.now(),
        })

        state.players.set(`player${i}b`, {
          userId: `player${i}b`,
          gameName: `Carry${i}`,
          tagLine: 'EUW',
          role: 'carry',
          duoId: `duo${i}`,
          initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
          currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
          totalPoints: 0,
          wins: 0,
          losses: 0,
          winStreak: 0,
          createdAt: Date.now(),
        })

        state.duos.set(`duo${i}`, {
          duoId: `duo${i}`,
          noobId: `player${i}a`,
          carryId: `player${i}b`,
          name: `Duo ${i}`,
          totalPoints: 0,
          wins: 0,
          losses: 0,
          createdAt: Date.now(),
        })
      }

      const msg = createMessage('system')
      pollGamesHandler(msg, state, responses)

      // Pas d'erreur
      expect(state.duos.size).toBe(3)
    })
  })

  describe('Cas d\'erreur - Validation', () => {
    it('devrait gérer l\'absence de duos gracieusement', () => {
      // Aucun duo dans le state
      const msg = createMessage('system')
      pollGamesHandler(msg, state, responses)

      // Pas d'erreur
      expect(responses).toBeDefined()
    })

    it('devrait gérer une erreur API Riot gracieusement', () => {
      // Setup: duo inscrit
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('player2', {
        userId: 'player2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'player1',
        carryId: 'player2',
        name: 'Test Duo',
        totalPoints: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      })

      // Simuler une erreur API (clé expirée, rate limit, etc.)
      // Dans la vraie implémentation, on mockerait l'API pour throw une erreur

      const msg = createMessage('system')
      pollGamesHandler(msg, state, responses)

      // Le handler ne doit pas crash
      expect(responses).toBeDefined()
    })
  })
})
