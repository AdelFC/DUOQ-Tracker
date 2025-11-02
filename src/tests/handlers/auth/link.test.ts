/**
 * Tests pour le handler LINK_ACCOUNT
 *
 * Le handler permet de créer un duo entre deux joueurs inscrits.
 * Il détermine automatiquement qui est noob/carry selon leur peakElo.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { linkHandler } from '../../../handlers/auth/link.handler.js'
import { state, message } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { State } from '../../../types/state.js'
import type { Response } from '../../../types/message.js'
import type { Player } from '../../../types/player.js'
import type { RankInfo } from '../../../types/player.js'

/**
 * Helper pour créer un joueur de test avec tous les champs requis
 */
function createTestPlayer(
  discordId: string,
  gameName: string,
  peakElo: string,
  currentRank: RankInfo,
  initialRank?: RankInfo
): Player {
  return {
    discordId,
    puuid: `puuid_${discordId}`,
    gameName,
    tagLine: 'EUW',
    role: 'noob',
    duoId: 0,
    peakElo,
    initialRank: initialRank || currentRank,
    currentRank,
    mainRoleString: 'MID',
    mainChampion: 'Yasuo',
    detectedMainRole: null,
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    streaks: { current: 0, longestWin: 0, longestLoss: 0 },
    registeredAt: new Date(),
    lastGameAt: null,
  }
}

describe('linkHandler', () => {
  let testState: State
  let responses: Response[]

  beforeEach(() => {
    testState = state().build()
    responses = []
  })

  describe('Success cases', () => {
    it('should create duo between two players (auto-detect noob/carry)', () => {
      // Setup: Gold IV et Platinum II
      const player1 = createTestPlayer('player1', 'GoldPlayer', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })
      const player2 = createTestPlayer('player2', 'PlatPlayer', 'P2', { tier: 'PLATINUM', division: 'II', lp: 30 })

      testState.players.set('player1', player1)
      testState.players.set('player2', player2)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'player2', teamName: 'Les Zinzins' })
        .fromSource('player1')
        .build()

      linkHandler(msg, testState, responses)

      // Vérifier qu'un duo a été créé
      expect(testState.duos.size).toBe(1)

      const duo = Array.from(testState.duos.values())[0]
      expect(duo.noobId).toBe('player1') // Gold < Plat
      expect(duo.carryId).toBe('player2')
      expect(duo.name).toBe('Les Zinzins')
      expect(duo.totalPoints).toBe(0)

      // Vérifier que les joueurs ont leur duoId mis à jour
      expect(testState.players.get('player1')!.duoId).toBe(duo.id)
      expect(testState.players.get('player2')!.duoId).toBe(duo.id)

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.SUCCESS)
      expect(responses[0].content).toContain('Duo créé')
    })

    it('should generate default duo name if not provided', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })
      const player2 = createTestPlayer('p2', 'Player2', 'P2', { tier: 'PLATINUM', division: 'II', lp: 30 })

      testState.players.set('p1', player1)
      testState.players.set('p2', player2)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      const duo = Array.from(testState.duos.values())[0]
      expect(duo!.name).toBeDefined()
      expect(duo!.name.length).toBeGreaterThan(0)
    })

    it('should handle same rank players (determine by LP)', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 30 }) // 30 LP
      const player2 = createTestPlayer('p2', 'Player2', 'G4', { tier: 'GOLD', division: 'IV', lp: 70 }) // 70 LP

      testState.players.set('p1', player1)
      testState.players.set('p2', player2)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      const duo = Array.from(testState.duos.values())[0]
      expect(duo.noobId).toBe('p1') // 30 LP < 70 LP
      expect(duo.carryId).toBe('p2')
    })
  })

  describe('Validation errors', () => {
    it('should reject if sender not registered', () => {
      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'player2' })
        .fromSource('unregistered')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0]!.type).toBe(MessageType.ERROR)
      expect(responses[0]!.content).toContain('lié')
    })

    it('should reject if partner not registered', () => {
      const player1 = createTestPlayer('player1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })

      testState.players.set('player1', player1)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'unknown' })
        .fromSource('player1')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('partenaire')
    })

    it('should reject if sender already in a duo', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })
      player1.duoId = 1 // Déjà en duo

      const player2 = createTestPlayer('p2', 'Player2', 'P2', { tier: 'PLATINUM', division: 'II', lp: 30 })

      testState.players.set('p1', player1)
      testState.players.set('p2', player2)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('déjà dans un duo')
    })

    it('should reject if partner already in a duo', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })

      const player2 = createTestPlayer('p2', 'Player2', 'P2', { tier: 'PLATINUM', division: 'II', lp: 30 })
      player2.duoId = 1 // Déjà en duo

      testState.players.set('p1', player1)
      testState.players.set('p2', player2)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'p2' })
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('partenaire')
      expect(responses[0].content).toContain('duo')
    })

    it('should reject if trying to link with self', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })

      testState.players.set('p1', player1)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({ partnerId: 'p1' })
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('toi-même')
    })

    it('should reject if partnerId missing', () => {
      const player1 = createTestPlayer('p1', 'Player1', 'G4', { tier: 'GOLD', division: 'IV', lp: 50 })

      testState.players.set('p1', player1)

      const msg = message()
        .withType(MessageType.LINK_ACCOUNT)
        .withPayload({})
        .fromSource('p1')
        .build()

      linkHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('partnerId')
    })
  })
})
