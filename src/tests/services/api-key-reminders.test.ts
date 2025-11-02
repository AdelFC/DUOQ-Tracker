import { describe, it, expect, beforeEach } from 'vitest'
import { checkApiKeyReminders } from '../../services/api-key-reminders'
import type { State, Config } from '../../types/state.js'
import type { Response } from '../../types/message.js'

function createTestConfig(hoursAgo?: number): Config {
  return {
    discordToken: 'test-token',
    guildId: 'test-guild',
    adminRoleId: 'admin-role',
    devChannelId: 'dev-channel',
    riotApiKey: 'RGAPI-test-key',
    riotApiKeyUpdatedAt: hoursAgo ? new Date(Date.now() - hoursAgo * 60 * 60 * 1000) : undefined,
    riotApiKeyReminders: [],
    region: 'EUW1',
    challengeStartDate: new Date(),
    challengeEndDate: new Date(),
    gameCheckInterval: 60000,
    maxGamesPerCheck: 10,
  }
}

function createTestState(hoursAgo?: number): State {
  return {
    players: new Map(),
    duos: new Map(),
    games: new Map(),
    devs: new Map(),
    config: createTestConfig(hoursAgo),
  }
}

describe('Service API Key Reminders', () => {
  let state: State
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  describe('Rappels à 22h', () => {
    it('devrait envoyer un rappel à 22h après le changement', () => {
      state = createTestState(22) // Clé changée il y a 22h

      // Ajouter 2 devs
      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })
      state.devs.set('dev2', {
        userId: 'dev2',
        username: 'DevTwo',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      // 2 notifications (une par dev)
      expect(responses).toHaveLength(2)
      expect(responses[0].targetId).toBe('dev1')
      expect(responses[1].targetId).toBe('dev2')

      // Vérifier le contenu
      expect(responses[0].content).toContain('22 heures')
      expect(responses[0].content).toContain('expirera')

      // Vérifier que le rappel a été enregistré
      expect((state.config as any).riotApiKeyReminders).toHaveLength(1);
    })

    it('ne devrait pas renvoyer le rappel de 22h si déjà envoyé', () => {
      state = createTestState(22);

      // Rappel déjà envoyé
      (state.config as any).riotApiKeyReminders = [new Date()]

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      // Pas de nouveau rappel
      expect(responses).toHaveLength(0)
    })
  })

  describe('Rappels à 23h', () => {
    it('devrait envoyer un rappel à 23h après le changement', () => {
      state = createTestState(23)

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('23 heures')
      expect(responses[0].content).toContain('expirera')

      // Vérifier que le rappel a été enregistré
      expect((state.config as any).riotApiKeyReminders).toHaveLength(1);
    })

    it('ne devrait pas envoyer le rappel de 23h si celui de 22h n\'a pas été envoyé', () => {
      state = createTestState(23);

      // Aucun rappel envoyé
      (state.config as any).riotApiKeyReminders = []

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      // Devrait envoyer le rappel de 23h quand même
      expect(responses).toHaveLength(1)
    })
  })

  describe('Rappels à 23h30', () => {
    it('devrait envoyer un rappel warning à 23h30 après le changement', () => {
      state = createTestState(23.5)

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('23h30')
      expect(responses[0].content).toContain('30 minutes')
      expect(responses[0].content).toContain('⚠️')

      // Vérifier que le rappel a été enregistré
      expect((state.config as any).riotApiKeyReminders).toHaveLength(1)
    })
  })

  describe('Rappels à 24h (expiration)', () => {
    it('devrait envoyer un rappel critique à 24h après le changement', () => {
      state = createTestState(24)

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('24 heures')
      expect(responses[0].content).toContain('expirée')
      expect(responses[0].content).toContain('🚨')

      // Vérifier que le rappel a été enregistré
      expect((state.config as any).riotApiKeyReminders).toHaveLength(1);
    })
  })

  describe('Cas spéciaux', () => {
    it('ne devrait rien faire si pas de clé API configurée', () => {
      state = createTestState()
      ;(state.config as any).riotApiKeyUpdatedAt = undefined

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(0)
    })

    it('ne devrait rien faire si aucun dev enregistré', () => {
      state = createTestState(22)

      // Aucun dev
      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(0)
    })

    it('ne devrait rien faire si la clé a moins de 22h', () => {
      state = createTestState(20) // Seulement 20h

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      expect(responses).toHaveLength(0)
    })

    it('ne devrait pas envoyer plusieurs fois le même rappel', () => {
      state = createTestState(22)

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      // Premier appel
      checkApiKeyReminders(state, responses)
      expect(responses).toHaveLength(1)

      // Deuxième appel (même heure)
      responses = []
      checkApiKeyReminders(state, responses)
      expect(responses).toHaveLength(0)
    })

    it('devrait gérer plusieurs devs simultanément', () => {
      state = createTestState(23)

      // Ajouter 5 devs
      for (let i = 1; i <= 5; i++) {
        state.devs.set(`dev${i}`, {
          userId: `dev${i}`,
          username: `Dev${i}`,
          registeredAt: new Date(),
        })
      }

      checkApiKeyReminders(state, responses)

      // 5 notifications
      expect(responses).toHaveLength(5)
      expect((state.config as any).riotApiKeyReminders).toHaveLength(1)
    })

    it('devrait envoyer tous les rappels manqués si la clé a dépassé 24h', () => {
      state = createTestState(25) // 25h, tous les rappels manqués

      state.devs.set('dev1', {
        userId: 'dev1',
        username: 'DevOne',
        registeredAt: new Date(),
      })

      checkApiKeyReminders(state, responses)

      // Devrait envoyer le dernier rappel (24h critique)
      expect(responses).toHaveLength(1)
      expect(responses[0].content).toContain('expirée')
    })
  })
})
