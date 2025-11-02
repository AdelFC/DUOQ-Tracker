import { describe, it, expect, beforeEach } from 'vitest'
import { endGameHandler } from '../../../handlers/game/end.handler'
import type { State } from '../../../types/state'
import type { Response, Message } from '../../../types/message'
import { MessageType } from '../../../types/message'
import type { GameData } from '../../../types/game'

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

function createMessage(sourceId: string, gameData?: GameData): Message {
  return {
    type: MessageType.GAME_ENDED,
    sourceId,
    timestamp: new Date(),
    payload: gameData,
  }
}

function createGameData(
  win: boolean,
  noobKDA: { k: number; d: number; a: number },
  carryKDA: { k: number; d: number; a: number },
  noobRankChange: { from: any; to: any },
  carryRankChange: { from: any; to: any }
): GameData {
  return {
    matchId: `EUW1_${Date.now()}`,
    gameId: Date.now(),
    startTime: new Date(),
    endTime: new Date(),
    duration: 1800,
    duoId: 1,
    noobStats: {
      puuid: 'puuid1',
      summonerId: 'player1',
      teamId: 100, // Blue team (same team by default)
      championId: 222,
      championName: 'Jinx',
      lane: 'BOTTOM',
      kills: noobKDA.k,
      deaths: noobKDA.d,
      assists: noobKDA.a,
      previousRank: noobRankChange.from,
      newRank: noobRankChange.to,
      isOffRole: false,
      isOffChampion: false,
    },
    carryStats: {
      puuid: 'puuid2',
      summonerId: 'player2',
      teamId: 100, // Blue team (same team by default)
      championId: 412,
      championName: 'Thresh',
      lane: 'BOTTOM',
      kills: carryKDA.k,
      deaths: carryKDA.d,
      assists: carryKDA.a,
      previousRank: carryRankChange.from,
      newRank: carryRankChange.to,
      isOffRole: false,
      isOffChampion: false,
    },
    win,
    status: 'COMPLETED',
    detectedAt: new Date(),
    scoredAt: null,
  }
}

describe('Handler Game End', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait scorer une victoire et mettre à jour les stats', () => {
      // Setup: duo inscrit
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.duos.set(1, {
        id: 1,
        noobId: 'discord1',
        carryId: 'discord2',
        name: 'Test Duo',
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        createdAt: new Date(),
        lastGameAt: null,
      })

      // Game data: victoire
      const gameData = createGameData(
        true,
        { k: 10, d: 3, a: 15 },
        { k: 8, d: 5, a: 20 },
        { from: { tier: 'GOLD', division: 'III', lp: 50 }, to: { tier: 'GOLD', division: 'II', lp: 75 } },
        { from: { tier: 'PLATINUM', division: 'II', lp: 30 }, to: { tier: 'PLATINUM', division: 'II', lp: 55 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      // Vérifier les stats mises à jour
      const noob = state.players.get('puuid1')!
      const carry = state.players.get('puuid2')!
      const duo = state.duos.get(1)!

      expect(noob.wins).toBe(1)
      expect(noob.losses).toBe(0)
      expect(noob.streaks.current).toBe(1)
      expect(noob.totalPoints).toBeGreaterThan(0)
      expect(noob.currentRank).toEqual({ tier: 'GOLD', division: 'II', lp: 75 })

      expect(carry.wins).toBe(1)
      expect(carry.losses).toBe(0)
      expect(carry.streaks.current).toBe(1)
      expect(carry.totalPoints).toBeGreaterThan(0)

      expect(duo.wins).toBe(1)
      expect(duo.losses).toBe(0)
      expect(duo.totalPoints).toBe(noob.totalPoints + carry.totalPoints)

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('victoire')
    })

    it('devrait scorer une défaite et mettre à jour les stats', () => {
      // Setup: duo inscrit avec une victoire préalable
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 50,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        streaks: { current: 1, longestWin: 1, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 60,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        streaks: { current: 1, longestWin: 1, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.duos.set(1, {
        id: 1,
        noobId: 'discord1',
        carryId: 'discord2',
        name: 'Test Duo',
        totalPoints: 110,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        currentStreak: 1,
        longestWinStreak: 1,
        longestLossStreak: 0,
        createdAt: new Date(),
        lastGameAt: null,
      })

      // Game data: défaite
      const gameData = createGameData(
        false,
        { k: 2, d: 10, a: 5 },
        { k: 3, d: 8, a: 8 },
        { from: { tier: 'GOLD', division: 'III', lp: 50 }, to: { tier: 'GOLD', division: 'III', lp: 30 } },
        { from: { tier: 'PLATINUM', division: 'II', lp: 30 }, to: { tier: 'PLATINUM', division: 'II', lp: 10 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      // Vérifier les stats mises à jour
      const noob = state.players.get('puuid1')!
      const carry = state.players.get('puuid2')!
      const duo = state.duos.get(1)!

      expect(noob.wins).toBe(1)
      expect(noob.losses).toBe(1)
      expect(noob.streaks.current).toBe(0) // Streak cassée
      expect(noob.totalPoints).toBeLessThan(50) // Perte de points

      expect(carry.wins).toBe(1)
      expect(carry.losses).toBe(1)
      expect(carry.streaks.current).toBe(0)
      expect(carry.totalPoints).toBeLessThan(60)

      expect(duo.wins).toBe(1)
      expect(duo.losses).toBe(1)

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('défaite')
    })

    it('devrait incrémenter le winStreak sur victoires consécutives', () => {
      // Setup: duo avec 2 victoires
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 75 },
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 100,
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        streaks: { current: 2, longestWin: 2, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 80 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 120,
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        streaks: { current: 2, longestWin: 2, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.duos.set(1, {
        id: 1,
        noobId: 'discord1',
        carryId: 'discord2',
        name: 'Test Duo',
        totalPoints: 220,
        gamesPlayed: 2,
        wins: 2,
        losses: 0,
        currentStreak: 2,
        longestWinStreak: 2,
        longestLossStreak: 0,
        createdAt: new Date(),
        lastGameAt: null,
      })

      // Troisième victoire
      const gameData = createGameData(
        true,
        { k: 12, d: 2, a: 18 },
        { k: 10, d: 3, a: 22 },
        { from: { tier: 'GOLD', division: 'III', lp: 75 }, to: { tier: 'GOLD', division: 'II', lp: 0 } },
        { from: { tier: 'PLATINUM', division: 'II', lp: 80 }, to: { tier: 'PLATINUM', division: 'I', lp: 5 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      const noob = state.players.get('puuid1')!
      const carry = state.players.get('puuid2')!

      expect(noob.streaks.current).toBe(3)
      expect(carry.streaks.current).toBe(3)
      expect(noob.wins).toBe(3)
      expect(carry.wins).toBe(3)
    })

    it('devrait gérer une promotion de rank', () => {
      // Setup
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 95 }, // Proche promo
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 50,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        streaks: { current: 1, longestWin: 1, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 55 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 60,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        streaks: { current: 1, longestWin: 1, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.duos.set(1, {
        id: 1,
        noobId: 'discord1',
        carryId: 'discord2',
        name: 'Test Duo',
        totalPoints: 110,
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        currentStreak: 1,
        longestWinStreak: 1,
        longestLossStreak: 0,
        createdAt: new Date(),
        lastGameAt: null,
      })

      // Victoire avec promotion
      const gameData = createGameData(
        true,
        { k: 10, d: 2, a: 15 },
        { k: 8, d: 4, a: 20 },
        { from: { tier: 'GOLD', division: 'III', lp: 95 }, to: { tier: 'GOLD', division: 'II', lp: 20 } }, // Promotion !
        { from: { tier: 'PLATINUM', division: 'II', lp: 55 }, to: { tier: 'PLATINUM', division: 'II', lp: 80 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      const noob = state.players.get('puuid1')!

      // Vérifier la promotion
      expect(noob.currentRank.tier).toBe('GOLD')
      expect(noob.currentRank.division).toBe('II')

      // Devrait avoir un bonus de rank change
      expect(noob.totalPoints).toBeGreaterThan(50)
    })
  })

  describe('Cas d\'erreur - Validation', () => {
    it('devrait échouer si gameData manquant', () => {
      const msg = createMessage('system')
      endGameHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('données de game manquantes')
    })

    it('devrait échouer si les joueurs ne forment pas un duo', () => {
      // Setup: deux joueurs SANS duo
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Solo1',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 0, // Pas de duo
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Solo2',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 0,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      const gameData = createGameData(
        true,
        { k: 5, d: 5, a: 5 },
        { k: 6, d: 6, a: 6 },
        { from: { tier: 'GOLD', division: 'III', lp: 50 }, to: { tier: 'GOLD', division: 'III', lp: 60 } },
        { from: { tier: 'PLATINUM', division: 'II', lp: 30 }, to: { tier: 'PLATINUM', division: 'II', lp: 40 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      // Ne devrait pas scorer
      expect(responses).toHaveLength(0)
    })

    it('devrait ignorer les joueurs non inscrits', () => {
      const gameData = createGameData(
        true,
        { k: 5, d: 5, a: 5 },
        { k: 6, d: 6, a: 6 },
        { from: { tier: 'GOLD', division: 'III', lp: 50 }, to: { tier: 'GOLD', division: 'III', lp: 60 } },
        { from: { tier: 'PLATINUM', division: 'II', lp: 30 }, to: { tier: 'PLATINUM', division: 'II', lp: 40 } }
      )

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      // Pas de scoring
      expect(responses).toHaveLength(0)
    })

    it('devrait ignorer si les deux joueurs sont dans des équipes différentes (soloQ)', () => {
      // Setup: duo inscrit
      state.players.set('puuid1', {
        discordId: 'discord1',
        puuid: 'puuid1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 1,
        peakElo: 'G2',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        mainRoleString: 'ADC',
        mainChampion: 'Jinx',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.players.set('puuid2', {
        discordId: 'discord2',
        puuid: 'puuid2',
        gameName: 'Carry',
        tagLine: 'EUW',
        role: 'carry',
        duoId: 1,
        peakElo: 'P2',
        initialRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        currentRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
        mainRoleString: 'SUPPORT',
        mainChampion: 'Thresh',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      state.duos.set(1, {
        id: 1,
        noobId: 'discord1',
        carryId: 'discord2',
        name: 'Test Duo',
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        createdAt: new Date(),
        lastGameAt: null,
      })

      // Game data: deux joueurs dans des équipes DIFFÉRENTES
      const gameData: GameData = {
        matchId: `EUW1_${Date.now()}`,
        gameId: Date.now(),
        startTime: new Date(),
        endTime: new Date(),
        duration: 1800,
        duoId: 1,
        noobStats: {
          puuid: 'puuid1',
          summonerId: 'player1',
          teamId: 100, // Blue team
          championId: 222,
          championName: 'Jinx',
          lane: 'BOTTOM',
          kills: 5,
          deaths: 5,
          assists: 5,
          previousRank: { tier: 'GOLD', division: 'III', lp: 50 },
          newRank: { tier: 'GOLD', division: 'III', lp: 60 },
          isOffRole: false,
          isOffChampion: false,
        },
        carryStats: {
          puuid: 'puuid2',
          summonerId: 'player2',
          teamId: 200, // Red team (DIFFÉRENT!)
          championId: 412,
          championName: 'Thresh',
          lane: 'BOTTOM',
          kills: 6,
          deaths: 6,
          assists: 6,
          previousRank: { tier: 'PLATINUM', division: 'II', lp: 30 },
          newRank: { tier: 'PLATINUM', division: 'II', lp: 40 },
          isOffRole: false,
          isOffChampion: false,
        },
        win: true,
        status: 'COMPLETED',
        detectedAt: new Date(),
        scoredAt: null,
      }

      const msg = createMessage('system', gameData)
      endGameHandler(msg, state, responses)

      // Ne devrait PAS scorer car joueurs dans des équipes différentes
      expect(responses).toHaveLength(0)

      // Vérifier qu'aucune stat n'a été modifiée
      const noob = state.players.get('puuid1')!
      const carry = state.players.get('puuid2')!
      const duo = state.duos.get(1)!

      expect(noob.wins).toBe(0)
      expect(carry.wins).toBe(0)
      expect(duo.wins).toBe(0)
      expect(noob.totalPoints).toBe(0)
      expect(carry.totalPoints).toBe(0)
      expect(duo.totalPoints).toBe(0)
    })
  })
})
