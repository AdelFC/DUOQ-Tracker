import { describe, it, expect, beforeEach } from 'vitest'
import { historyHandler } from '../../../handlers/stats/history.handler'
import type { State } from '../../../types/state.js'
import type { Response, Message } from '../../../types/message.js'

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

function createMessage(sourceId: string, payload: { targetId?: string; page?: number } = {}): Message {
  return {
    type: 'history',
    sourceId,
    payload,
  }
}

describe('Handler History', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait afficher l\'historique complet d\'un duo avec plusieurs games', () => {
      // Setup: duo avec 5 games
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'II', lp: 75 },
        totalPoints: 150,
        wins: 3,
        losses: 2,
        winStreak: 2,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'I', lp: 50 },
        totalPoints: 160,
        wins: 3,
        losses: 2,
        winStreak: 2,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Test Duo',
        totalPoints: 310,
        wins: 3,
        losses: 2,
        createdAt: Date.now(),
      })

      // 5 games jouées
      for (let i = 1; i <= 5; i++) {
        const gameDate = new Date(Date.now() + i * 1000)
        state.games.set(`match${i}`, {
          id: `match${i}`,
          matchId: `match${i}`,
          duoId: 'duo1',
          startTime: gameDate,
          endTime: new Date(gameDate.getTime() + 1800000),
          createdAt: gameDate,
          win: i <= 3, // 3 wins, 2 losses
          scored: true,
          noobKDA: '8/3/12',
          carryKDA: '10/2/15',
          noobKills: 8,
          noobDeaths: 3,
          noobAssists: 12,
          carryKills: 10,
          carryDeaths: 2,
          carryAssists: 15,
          noobChampion: 'Jinx',
          carryChampion: 'Thresh',
          pointsAwarded: i <= 3 ? 50 : -30,
          duration: 1800,
        })
      }

      const msg = createMessage('p1')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Devrait afficher les 5 games
      expect(embed.description).toContain('match1')
      expect(embed.description).toContain('match5')

      // Vérifier les victoires et défaites
      expect(embed.description).toContain('🏆') // victoire
      expect(embed.description).toContain('💀') // défaite
    })

    it('devrait afficher l\'historique d\'un joueur solo (sans duo)', () => {
      // Setup: joueur sans duo
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'SoloPlayer',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('p1')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('Aucune game')
    })

    it('devrait afficher l\'historique trié par date (plus récent en premier)', () => {
      // Setup
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 75 },
        totalPoints: 100,
        wins: 3,
        losses: 0,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 55 },
        totalPoints: 120,
        wins: 3,
        losses: 0,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Test Duo',
        totalPoints: 220,
        wins: 3,
        losses: 0,
        createdAt: Date.now(),
      })

      // 3 games avec timestamps différents
      const game1Date = new Date('2025-01-01T10:00:00Z')
      state.games.set('match1', {
        id: 'match1',
        matchId: 'match1',
        duoId: 'duo1',
        startTime: game1Date,
        endTime: new Date(game1Date.getTime() + 1800000),
        createdAt: game1Date, // Ancienne
        win: true,
        scored: true,
        noobKDA: '10/2/15',
        carryKDA: '8/3/20',
        noobKills: 10,
        noobDeaths: 2,
        noobAssists: 15,
        carryKills: 8,
        carryDeaths: 3,
        carryAssists: 20,
        noobChampion: 'Jinx',
        carryChampion: 'Thresh',
        pointsAwarded: 50,
        duration: 1800,
      })

      const game2Date = new Date('2025-01-03T10:00:00Z')
      state.games.set('match2', {
        id: 'match2',
        matchId: 'match2',
        duoId: 'duo1',
        startTime: game2Date,
        endTime: new Date(game2Date.getTime() + 1500000),
        createdAt: game2Date, // Plus récente
        win: true,
        scored: true,
        noobKDA: '12/1/18',
        carryKDA: '10/2/22',
        noobKills: 12,
        noobDeaths: 1,
        noobAssists: 18,
        carryKills: 10,
        carryDeaths: 2,
        carryAssists: 22,
        noobChampion: 'Caitlyn',
        carryChampion: 'Leona',
        pointsAwarded: 55,
        duration: 1500,
      })

      const game3Date = new Date('2025-01-02T10:00:00Z')
      state.games.set('match3', {
        id: 'match3',
        matchId: 'match3',
        duoId: 'duo1',
        startTime: game3Date,
        endTime: new Date(game3Date.getTime() + 2100000),
        createdAt: game3Date, // Milieu
        win: true,
        scored: true,
        noobKDA: '8/4/12',
        carryKDA: '7/5/18',
        noobKills: 8,
        noobDeaths: 4,
        noobAssists: 12,
        carryKills: 7,
        carryDeaths: 5,
        carryAssists: 18,
        noobChampion: 'Ashe',
        carryChampion: 'Nautilus',
        pointsAwarded: 45,
        duration: 2100,
      })

      const msg = createMessage('p1')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // match2 devrait apparaître en premier (plus récent)
      const match2Index = embed.description.indexOf('match2')
      const match3Index = embed.description.indexOf('match3')
      const match1Index = embed.description.indexOf('match1')

      expect(match2Index).toBeLessThan(match3Index)
      expect(match3Index).toBeLessThan(match1Index)
    })

    it('devrait afficher les KDA et points de chaque game', () => {
      // Setup: duo avec 1 game
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 70 },
        totalPoints: 50,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 50 },
        totalPoints: 55,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Test Duo',
        totalPoints: 105,
        wins: 1,
        losses: 0,
        createdAt: Date.now(),
      })

      const gameDate = new Date()
      state.games.set('match1', {
        id: 'match1',
        matchId: 'match1',
        duoId: 'duo1',
        startTime: gameDate,
        endTime: new Date(gameDate.getTime() + 1800000),
        createdAt: gameDate,
        win: true,
        scored: true,
        noobKDA: '10/3/15',
        carryKDA: '8/2/20',
        noobKills: 10,
        noobDeaths: 3,
        noobAssists: 15,
        carryKills: 8,
        carryDeaths: 2,
        carryAssists: 20,
        noobChampion: 'Jinx',
        carryChampion: 'Thresh',
        pointsAwarded: 105,
        duration: 1800,
      })

      const msg = createMessage('p1')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Vérifier présence des KDA
      expect(embed.description).toContain('10')
      expect(embed.description).toContain('3')
      expect(embed.description).toContain('15')

      // Vérifier les points
      expect(embed.description).toContain('105')
    })

    it('devrait paginer l\'historique (10 games par page)', () => {
      // Setup: duo avec 25 games
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'I', lp: 80 },
        totalPoints: 500,
        wins: 20,
        losses: 5,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'I', lp: 60 },
        totalPoints: 550,
        wins: 20,
        losses: 5,
        winStreak: 3,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Test Duo',
        totalPoints: 1050,
        wins: 20,
        losses: 5,
        createdAt: Date.now(),
      })

      // 25 games
      for (let i = 1; i <= 25; i++) {
        const gameDate = new Date(Date.now() + i * 1000)
        state.games.set(`match${i}`, {
          id: `match${i}`,
          matchId: `match${i}`,
          duoId: 'duo1',
          startTime: gameDate,
          endTime: new Date(gameDate.getTime() + 1800000),
          createdAt: gameDate,
          win: i <= 20,
          scored: true,
          noobKDA: '8/3/12',
          carryKDA: '10/2/15',
          noobKills: 8,
          noobDeaths: 3,
          noobAssists: 12,
          carryKills: 10,
          carryDeaths: 2,
          carryAssists: 15,
          noobChampion: 'Jinx',
          carryChampion: 'Thresh',
          pointsAwarded: i <= 20 ? 50 : -30,
          duration: 1800,
        })
      }

      // Page 1
      const msg = createMessage('p1', [])
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Devrait afficher seulement 10 games sur la page 1
      expect(embed.footer.text).toContain('Page 1/3')
      expect(embed.footer.text).toContain('25 games')
    })

    it('devrait afficher l\'historique d\'un autre duo via mention', () => {
      // Setup: 2 duos
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Noob1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 70 },
        totalPoints: 50,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Carry1',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 50 },
        totalPoints: 55,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.players.set('p3', {
        userId: 'p3',
        gameName: 'Noob2',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo2',
        initialRank: { tier: 'SILVER', division: 'I', lp: 80 },
        currentRank: { tier: 'SILVER', division: 'I', lp: 90 },
        totalPoints: 30,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.players.set('p4', {
        userId: 'p4',
        gameName: 'Carry2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo2',
        initialRank: { tier: 'GOLD', division: 'IV', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 60 },
        totalPoints: 35,
        wins: 1,
        losses: 0,
        winStreak: 1,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Duo 1',
        totalPoints: 105,
        wins: 1,
        losses: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo2', {
        duoId: 'duo2',
        noobId: 'p3',
        carryId: 'p4',
        name: 'Duo 2',
        totalPoints: 65,
        wins: 1,
        losses: 0,
        createdAt: Date.now(),
      })

      const gameDate = new Date()
      state.games.set('match1', {
        id: 'match1',
        matchId: 'match1',
        duoId: 'duo2',
        startTime: gameDate,
        endTime: new Date(gameDate.getTime() + 1800000),
        createdAt: gameDate,
        win: true,
        scored: true,
        noobKDA: '5/5/10',
        carryKDA: '7/4/12',
        noobKills: 5,
        noobDeaths: 5,
        noobAssists: 10,
        carryKills: 7,
        carryDeaths: 4,
        carryAssists: 12,
        noobChampion: 'Jinx',
        carryChampion: 'Thresh',
        pointsAwarded: 65,
        duration: 1800,
      })

      // p1 demande l'historique de p3 (qui est dans duo2)
      const msg = createMessage('p1', { targetId: 'p3' })
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      const embed = JSON.parse(content)

      // Devrait afficher l'historique de duo2
      expect(embed.title).toContain('Duo 2')
    })
  })

  describe('Cas d\'erreur', () => {
    it('devrait retourner une erreur si le joueur n\'est pas inscrit', () => {
      // Aucun joueur inscrit
      const msg = createMessage('unknown')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('unknown')

      const content = responses[0].content
      expect(content).toContain('inscrit')
    })

    it('devrait retourner une erreur si le joueur mentionné n\'existe pas', () => {
      // Setup: p1 existe mais pas p2
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Player1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      // p1 demande l'historique de p2 (inexistant)
      const msg = createMessage('p1', { targetId: 'p2' })
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('p1')

      const content = responses[0].content
      expect(content).toContain('inscrit')
    })
  })

  describe('Cas spéciaux', () => {
    it('devrait afficher 0 games pour un duo qui vient d\'être créé', () => {
      // Setup: duo sans games
      state.players.set('p1', {
        userId: 'p1',
        gameName: 'Newbie',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        currentRank: { tier: 'GOLD', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.players.set('p2', {
        userId: 'p2',
        gameName: 'Newbie2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 'duo1',
        initialRank: { tier: 'PLATINUM', division: 'IV', lp: 0 },
        currentRank: { tier: 'PLATINUM', division: 'IV', lp: 0 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'p1',
        carryId: 'p2',
        name: 'Fresh Duo',
        totalPoints: 0,
        wins: 0,
        losses: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('p1')
      historyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)

      const content = responses[0].content
      const embed = JSON.parse(content)

      expect(embed.description).toContain('Aucune game')
    })
  })
})
