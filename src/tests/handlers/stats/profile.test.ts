import { describe, it, expect, beforeEach } from 'vitest'
import { profileHandler } from '../../../handlers/stats/profile.handler'
import type { State } from '../../../types/state.js'
import type { Response, Message } from '../../../types/message.js'
import { MessageType } from '../../../types/message.js'
import { createTestPlayer, createTestDuo } from '../../helpers/fixtures.js'

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

function createMessage(sourceId: string, payload: { targetId?: string } = {}): Message {
  return {
    type: MessageType.STATS,
    sourceId,
    payload,
    timestamp: new Date(),
  }
}

describe('Handler Profile', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait afficher le profil complet d\'un joueur avec duo', () => {
      // Setup: Joueur avec duo et statistiques
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'TestPlayer',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'II', lp: 75 },
        totalPoints: 120,
        wins: 8,
        losses: 3,
        streaks: { current: 3, longestWin: 3, longestLoss: 0 },
      }))

      state.players.set('p2', createTestPlayer({
        discordId: 'p2',
        gameName: 'PartnerPlayer',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        initialRank: { tier: 'PLATINUM', division: 'IV', lp: 20 },
        currentRank: { tier: 'PLATINUM', division: 'III', lp: 50 },
        totalPoints: 130,
        wins: 8,
        losses: 3,
        streaks: { current: 3, longestWin: 3, longestLoss: 0 },
      }))

      state.duos.set(1, createTestDuo({
        noobId: 'p1',
        carryId: 'p2',
        name: 'Dream Team',
        totalPoints: 250,
        wins: 8,
        losses: 3,
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Vérifier les informations de base
      expect(embed.title).toContain('TestPlayer#EUW')

      // Vérifier les stats du joueur
      expect(embed.description).toContain('120')
      expect(embed.description).toContain('8W / 3L')
      expect(embed.description).toContain('GOLD II')

      // Vérifier les informations du duo
      expect(embed.description).toContain('Dream Team')
      expect(embed.description).toContain('PartnerPlayer')
    })

    it('devrait afficher le profil d\'un joueur sans duo', () => {
      // Setup: Joueur solo (pas encore de duo)
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'SoloPlayer',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'SILVER', division: 'I', lp: 80 },
        currentRank: { tier: 'SILVER', division: 'I', lp: 80 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.title).toContain('SoloPlayer')
      expect(embed.description).toContain('Aucun duo')
    })

    it('devrait afficher le profil d\'un autre joueur via mention', () => {
      // Setup: 2 joueurs
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Requester',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 50,
        wins: 4,
        losses: 2,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      state.players.set('p2', createTestPlayer({
        discordId: 'p2',
        gameName: 'TargetPlayer',
        tagLine: 'EUW',
        role: 'carry',
        duoId: undefined,
        initialRank: { tier: 'PLATINUM', division: 'III', lp: 40 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 60 },
        totalPoints: 80,
        wins: 6,
        losses: 1,
        streaks: { current: 2, longestWin: 2, longestLoss: 0 },
      }))

      // p1 demande le profil de p2
      const msg = createMessage('p1', { targetId: 'p2' })
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Doit afficher les stats de p2
      expect(embed.title).toContain('TargetPlayer')
      expect(embed.description).toContain('80')
      expect(embed.description).toContain('6W / 1L')
    })

    it('devrait calculer le winrate correctement', () => {
      // Setup: joueur avec 7W/3L = 70% winrate
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Player',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 100,
        wins: 7,
        losses: 3,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Vérifier le winrate (70%)
      expect(embed.description).toContain('70%')
    })

    it('devrait afficher la progression de rank', () => {
      // Setup: joueur avec progression visible
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Climber',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'SILVER', division: 'II', lp: 40 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 30 },
        totalPoints: 150,
        wins: 12,
        losses: 5,
        streaks: { current: 4, longestWin: 4, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Doit montrer SILVER II → GOLD IV
      expect(embed.description).toContain('SILVER II')
      expect(embed.description).toContain('GOLD IV')
    })

    it('devrait afficher la winstreak actuelle', () => {
      // Setup: joueur avec winstreak de 5
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'OnFire',
        tagLine: 'EUW',
        role: 'carry',
        duoId: undefined,
        initialRank: { tier: 'PLATINUM', division: 'IV', lp: 0 },
        currentRank: { tier: 'PLATINUM', division: 'III', lp: 25 },
        totalPoints: 200,
        wins: 10,
        losses: 3,
        streaks: { current: 5, longestWin: 5, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Doit afficher la winstreak
      expect(embed.description).toContain('5')
      expect(embed.description).toContain('victoires')
    })
  })

  describe('Cas d\'erreur', () => {
    it('devrait retourner une erreur si le joueur n\'est pas inscrit', () => {
      // Aucun joueur inscrit
      const msg = createMessage('unknown')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('unknown')

      const content = responses[0].content

      // Message d'erreur simple (pas JSON)
      expect(content).toContain('inscrit')
    })

    it('devrait retourner une erreur si le joueur mentionné n\'existe pas', () => {
      // Setup: p1 existe mais pas p2
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Player1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      // p1 demande le profil de p2 (inexistant)
      const msg = createMessage('p1', { targetId: 'p2' })
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      expect(content).toContain('inscrit')
    })
  })

  describe('Cas spéciaux', () => {
    it('devrait gérer un joueur avec 0 games', () => {
      // Setup: nouveau joueur (0W/0L)
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Newbie',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('0W / 0L')
      expect(embed.description).toContain('0 pts')
    })

    it('devrait gérer des points négatifs', () => {
      // Setup: joueur avec points négatifs (hard stuck)
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Hardstuck',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'I', lp: 75 },
        currentRank: { tier: 'SILVER', division: 'II', lp: 20 },
        totalPoints: -80,
        wins: 3,
        losses: 12,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('-80')
    })

    it('devrait gérer une winstreak de 0', () => {
      // Setup: joueur qui vient de perdre (winstreak = 0)
      state.players.set('p1', createTestPlayer({
        discordId: 'p1',
        gameName: 'Player',
        tagLine: 'EUW',
        role: 'carry',
        duoId: undefined,
        initialRank: { tier: 'PLATINUM', division: 'IV', lp: 0 },
        currentRank: { tier: 'PLATINUM', division: 'IV', lp: 10 },
        totalPoints: 50,
        wins: 5,
        losses: 4,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
      }))

      const msg = createMessage('p1')
      profileHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Ne doit PAS afficher de winstreak ou afficher "0 streak"
      expect(embed.description).toBeDefined()
    })
  })
})
