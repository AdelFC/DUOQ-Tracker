import { describe, it, expect, beforeEach } from 'vitest'
import { unregisterHandler } from '../../../handlers/auth/unregister.handler'
import type { State } from '../../../types/state.js'
import type { Response, Message } from '../../../types/message.js'

function createTestState(): State {
  return {
    players: new Map(),
    duos: new Map(),
  }
}

function createMessage(sourceId: string, payload: {} = {}): Message {
  return {
    type: 'unregister',
    sourceId,
    payload,
  }
}

describe('Handler Unregister', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait supprimer un joueur seul (pas dans un duo)', () => {
      // Setup: joueur inscrit mais pas en duo
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'TestPlayer',
        tagLine: 'EUW',
        role: 'noob',
        duoId: undefined,
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 0,
        wins: 0,
        losses: 0,
        winStreak: 0,
        createdAt: Date.now(),
      })

      const msg = createMessage('player1')
      unregisterHandler(msg, state, responses)

      expect(state.players.has('player1')).toBe(false)
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('player1')
      expect(responses[0].content).toContain('désinscrit')
    })

    it('devrait dissoudre le duo et supprimer le joueur', () => {
      // Setup: deux joueurs en duo
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

      const msg = createMessage('player1')
      unregisterHandler(msg, state, responses)

      // Player1 supprimé
      expect(state.players.has('player1')).toBe(false)

      // Player2 existe toujours mais n'est plus en duo
      expect(state.players.has('player2')).toBe(true)
      expect(state.players.get('player2')!.duoId).toBe(0)

      // Duo supprimé
      expect(state.duos.has('duo1')).toBe(false)

      // 2 réponses : une pour player1, une pour player2
      expect(responses).toHaveLength(2)

      const player1Response = responses.find((r) => r.targetId === 'player1')
      const player2Response = responses.find((r) => r.targetId === 'player2')

      expect(player1Response).toBeDefined()
      expect(player1Response!.content).toContain('désinscrit')
      expect(player2Response).toBeDefined()
      expect(player2Response!.content).toContain('dissous')
    })

    it('devrait notifier le partenaire quand un duo est dissous', () => {
      // Setup: deux joueurs en duo
      state.players.set('player1', {
        userId: 'player1',
        gameName: 'Noob',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 'duo1',
        initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
        currentRank: { tier: 'GOLD', division: 'III', lp: 50 },
        totalPoints: 100,
        wins: 5,
        losses: 2,
        winStreak: 2,
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
        totalPoints: 120,
        wins: 5,
        losses: 2,
        winStreak: 2,
        createdAt: Date.now(),
      })

      state.duos.set('duo1', {
        duoId: 'duo1',
        noobId: 'player1',
        carryId: 'player2',
        name: 'Test Duo',
        totalPoints: 220,
        wins: 5,
        losses: 2,
        createdAt: Date.now(),
      })

      const msg = createMessage('player1')
      unregisterHandler(msg, state, responses)

      // Vérifier la notification au partenaire
      const partnerResponse = responses.find((r) => r.targetId === 'player2')
      expect(partnerResponse).toBeDefined()
      expect(partnerResponse!.content).toContain('Noob')
      expect(partnerResponse!.content).toContain('quitté')
    })
  })

  describe('Cas d\'erreur - Validation', () => {
    it('devrait échouer si le joueur n\'est pas inscrit', () => {
      const msg = createMessage('player1')
      unregisterHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('player1')
      expect(responses[0].content).toContain('pas inscrit')
    })
  })
})
