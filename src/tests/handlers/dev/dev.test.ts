import { describe, it, expect, beforeEach } from 'vitest'
import { devHandler } from '../../../handlers/dev/dev.handler'
import { State, Response, Message, Config } from '../../../types'

function createTestConfig(): Config {
  return {
    discordToken: 'test-token',
    guildId: 'test-guild',
    adminRoleId: 'admin-role',
    devChannelId: 'dev-channel',
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

function createMessage(sourceId: string, username: string): Message {
  return {
    type: 'dev',
    sourceId,
    payload: {
      username,
    },
  }
}

describe('Handler Dev', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    state = createTestState()
    responses = []
  })

  describe('Cas de succès', () => {
    it('devrait enregistrer un nouveau dev', () => {
      const msg = createMessage('dev123', 'DevUsername')

      devHandler(msg, state, responses)

      // Vérifier que le dev a été ajouté
      expect(state.devs.has('dev123')).toBe(true)
      const dev = state.devs.get('dev123')!
      expect(dev.userId).toBe('dev123')
      expect(dev.username).toBe('DevUsername')
      expect(dev.registeredAt).toBeDefined()

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('dev123')
      expect(responses[0].content).toContain('authentifié')
      expect(responses[0].content).toContain('DevUsername')
    })

    it('devrait afficher un message pour un dev déjà enregistré', () => {
      // Setup: dev déjà enregistré
      state.devs.set('dev123', {
        userId: 'dev123',
        username: 'DevUsername',
        registeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Il y a 1 jour
      })

      const msg = createMessage('dev123', 'DevUsername')
      devHandler(msg, state, responses)

      // Le dev reste enregistré
      expect(state.devs.has('dev123')).toBe(true)

      // Vérifier la réponse (message différent)
      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('dev123')
      expect(responses[0].content).toContain('déjà authentifié')
    })

    it('devrait lister les commandes disponibles', () => {
      const msg = createMessage('dev123', 'DevUsername')
      devHandler(msg, state, responses)

      // Vérifier que les commandes sont listées
      expect(responses[0].content).toContain('/key')
      expect(responses[0].content).toContain('/devlist')
    })

    it('devrait mentionner les rappels de clé API', () => {
      const msg = createMessage('dev123', 'DevUsername')
      devHandler(msg, state, responses)

      // Vérifier que les rappels sont mentionnés
      expect(responses[0].content).toContain('rappels')
      expect(responses[0].content).toContain('API')
    })

    it('devrait enregistrer plusieurs devs différents', () => {
      const msg1 = createMessage('dev1', 'DevOne')
      const msg2 = createMessage('dev2', 'DevTwo')
      const msg3 = createMessage('dev3', 'DevThree')

      devHandler(msg1, state, [])
      devHandler(msg2, state, [])
      devHandler(msg3, state, [])

      expect(state.devs.size).toBe(3)
      expect(state.devs.has('dev1')).toBe(true)
      expect(state.devs.has('dev2')).toBe(true)
      expect(state.devs.has('dev3')).toBe(true)
    })
  })

  describe('Cas spéciaux', () => {
    it('devrait gérer un username vide', () => {
      const msg = createMessage('dev123', '')
      devHandler(msg, state, responses)

      expect(state.devs.has('dev123')).toBe(true)
      const dev = state.devs.get('dev123')!
      expect(dev.username).toBe('Inconnu')
    })

    it('devrait gérer un username avec espaces', () => {
      const msg = createMessage('dev123', '  Dev User  ')
      devHandler(msg, state, responses)

      expect(state.devs.has('dev123')).toBe(true)
      const dev = state.devs.get('dev123')!
      expect(dev.username).toBe('Dev User') // Trimmed
    })

    it('devrait mettre à jour le timestamp si dev déjà enregistré', () => {
      // Setup: dev enregistré il y a 1 jour
      const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      state.devs.set('dev123', {
        userId: 'dev123',
        username: 'DevUsername',
        registeredAt: oldDate,
      })

      const msg = createMessage('dev123', 'DevUsername')
      devHandler(msg, state, responses)

      const dev = state.devs.get('dev123')!
      const timeSinceReg = Date.now() - dev.registeredAt.getTime()

      // Le timestamp doit être récent (moins d'1 seconde)
      expect(timeSinceReg).toBeLessThan(1000)
    })

    it('devrait gérer le changement de username', () => {
      // Setup: dev enregistré avec ancien username
      state.devs.set('dev123', {
        userId: 'dev123',
        username: 'OldUsername',
        registeredAt: new Date(),
      })

      const msg = createMessage('dev123', 'NewUsername')
      devHandler(msg, state, responses)

      const dev = state.devs.get('dev123')!
      expect(dev.username).toBe('NewUsername')
    })
  })
})
