import { describe, it, expect, beforeEach } from 'vitest'
import { keyHandler } from '../../../handlers/dev/key.handler'
import type { State, Config } from '../../../types/state.js'
import type { Response, Message } from '../../../types/message.js'

function createTestConfig(): Config {
  return {
    discordToken: 'test-token',
    guildId: 'test-guild',
    adminRoleId: 'admin-role',
    devChannelId: 'dev-channel',
    riotApiKey: 'RGAPI-old-key',
    riotApiKeyUpdatedAt: undefined,
    riotApiKeyReminders: [],
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
    config: createTestConfig(),
  }
}

function createMessage(sourceId: string, payload: { apiKey?: string }): Message {
  return {
    type: 'key',
    sourceId,
    payload,
  }
}

describe('Handler Key', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait mettre à jour la clé API Riot', () => {
      const newKey = 'RGAPI-new-key-12345'
      const msg = createMessage('admin1', { apiKey: newKey })

      keyHandler(msg, state, responses)

      // Vérifier que la clé a été mise à jour
      expect(state.config.riotApiKey).toBe(newKey)
      expect(state.config.riotApiKeyUpdatedAt).toBeDefined()
      expect(state.config.riotApiKeyReminders).toEqual([])

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('admin1')
      expect(responses[0].content).toContain('mise à jour avec succès')
      expect(responses[0].content).toContain('RGAPI-new-key-12345')
    })

    it('devrait réinitialiser les rappels lors du changement de clé', () => {
      // Setup: clé existante avec rappels déjà envoyés
      state.config.riotApiKeyUpdatedAt = new Date(Date.now() - 23 * 60 * 60 * 1000) // Il y a 23h
      state.config.riotApiKeyReminders = [
        new Date(Date.now() - 2 * 60 * 60 * 1000), // Rappel à 22h
        new Date(Date.now() - 1 * 60 * 60 * 1000), // Rappel à 23h
      ]

      const newKey = 'RGAPI-fresh-key'
      const msg = createMessage('admin1', { apiKey: newKey })

      keyHandler(msg, state, responses)

      // Vérifier que les rappels ont été réinitialisés
      expect(state.config.riotApiKeyReminders).toEqual([])
      expect(state.config.riotApiKeyUpdatedAt).toBeDefined()

      // Le timestamp doit être récent (moins d'1 seconde)
      const now = Date.now()
      const updatedAt = state.config.riotApiKeyUpdatedAt!.getTime()
      expect(now - updatedAt).toBeLessThan(1000)
    })

    it('devrait afficher un message de rappel des expirations', () => {
      const newKey = 'RGAPI-test-key'
      const msg = createMessage('admin1', { apiKey: newKey })

      keyHandler(msg, state, responses)

      // Vérifier que le message mentionne les rappels
      expect(responses[0].content).toContain('22h')
      expect(responses[0].content).toContain('23h')
      expect(responses[0].content).toContain('23h30')
      expect(responses[0].content).toContain('24h')
    })

    it('devrait accepter les clés API avec format RGAPI-', () => {
      const validKeys = [
        'RGAPI-12345678-abcd-efgh-ijkl-123456789012',
        'RGAPI-short',
        'RGAPI-very-long-key-with-many-characters-1234567890',
      ]

      validKeys.forEach((key) => {
        const testState = createTestState()
        const testResponses: Response[] = []
        const msg = createMessage('admin1', { apiKey: key })

        keyHandler(msg, testState, testResponses)

        expect(testState.config.riotApiKey).toBe(key)
        expect(testResponses).toHaveLength(1)
        expect(testResponses[0].content).toContain('mise à jour avec succès')
      })
    })
  })

  describe('Cas d\'erreur - Validation', () => {
    it('devrait échouer si aucune clé fournie', () => {
      const msg = createMessage('admin1', {})

      keyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('admin1')
      expect(responses[0].content).toContain('Usage')
      expect(responses[0].content).toContain('/key <api_key>')

      // La clé ne doit pas avoir changé
      expect(state.config.riotApiKey).toBe('RGAPI-old-key')
    })

    it('devrait échouer si la clé ne commence pas par RGAPI-', () => {
      const invalidKeys = ['invalid-key', '12345', 'API-KEY-123', 'rgapi-lowercase']

      invalidKeys.forEach((key) => {
        const testState = createTestState()
        const testResponses: Response[] = []
        const msg = createMessage('admin1', { apiKey: key })

        keyHandler(msg, testState, testResponses)

        expect(testResponses).toHaveLength(1)
        expect(testResponses[0].content).toContain('invalide')
        expect(testResponses[0].content).toContain('RGAPI-')

        // La clé ne doit pas avoir changé
        expect(testState.config.riotApiKey).toBe('RGAPI-old-key')
      })
    })

    it('devrait échouer si la clé est trop courte', () => {
      const tooShort = 'RGAPI-'

      const msg = createMessage('admin1', { apiKey: tooShort })
      keyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('invalide')

      // La clé ne doit pas avoir changé
      expect(state.config.riotApiKey).toBe('RGAPI-old-key')
    })

    it('devrait ignorer les champs supplémentaires dans le payload', () => {
      const msg = createMessage('admin1', { apiKey: 'RGAPI-key1', extraArg: 'extra-arg' } as any)

      keyHandler(msg, state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('mise à jour avec succès')

      // La clé doit avoir changé (les champs supplémentaires sont ignorés)
      expect(state.config.riotApiKey).toBe('RGAPI-key1')
    })
  })

  describe('Cas spéciaux', () => {
    it('devrait gérer une clé avec espaces (trim)', () => {
      const keyWithSpaces = '  RGAPI-key-with-spaces  '
      const msg = createMessage('admin1', { apiKey: keyWithSpaces })

      keyHandler(msg, state, responses)

      // Devrait trim la clé
      expect(state.config.riotApiKey).toBe('RGAPI-key-with-spaces')
      expect(responses[0].content).toContain('mise à jour')
    })

    it('devrait afficher un warning si la même clé est re-soumise', () => {
      state.config.riotApiKey = 'RGAPI-same-key'
      state.config.riotApiKeyUpdatedAt = new Date(Date.now() - 1000)

      const msg = createMessage('admin1', { apiKey: 'RGAPI-same-key' })
      keyHandler(msg, state, responses)

      // Clé mise à jour quand même
      expect(state.config.riotApiKey).toBe('RGAPI-same-key')

      // Mais avec un warning
      expect(responses[0].content).toContain('identique')
    })
  })
})
