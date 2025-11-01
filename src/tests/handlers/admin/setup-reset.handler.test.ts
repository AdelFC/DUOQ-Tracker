/**
 * Tests pour setup-reset.handler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleSetupReset } from '../../../handlers/admin/setup-reset.handler.js'
import { message, state, player, duo } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'
import type { ConfigService } from '../../../services/config/index.js'

describe('handleSetupReset', () => {
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  it('should reject without confirmation', async () => {
    const msg = message(MessageType.SETUP_RESET, {
      // No confirm parameter
    }).build()

    const testState = state().build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const errorResponse = responses[0]

    expect(errorResponse.type).toBe(MessageType.ERROR)
    expect(errorResponse.targetId).toBe(msg.sourceId)
    expect(errorResponse.ephemeral).toBe(true)
    expect(errorResponse.content).toContain('ATTENTION')
    expect(errorResponse.content).toContain('destructive')
    expect(errorResponse.content).toContain('confirm:true')
  })

  it('should reject with confirm:false', async () => {
    const msg = message(MessageType.SETUP_RESET, {
      confirm: false,
    }).build()

    const testState = state().build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('confirm')
  })

  it('should reset all data with confirmation', async () => {
    const testState = state().build()

    // Add some test data
    const player1 = player('user1').withGameName('Player1', 'EUW').asNoob().build()
    const player2 = player('user2').withGameName('Player2', 'EUW').asCarry().build()
    const testDuo = duo('user1', 'user2').withId(1).build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)
    testState.duos.set(testDuo.id, testDuo)

    // Verify data is present
    expect(testState.players.size).toBe(2)
    expect(testState.duos.size).toBe(1)

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    // Should have success response
    expect(responses).toHaveLength(1)
    const successResponse = responses[0]

    expect(successResponse.type).toBe(MessageType.SUCCESS)
    expect(successResponse.targetId).toBe(msg.sourceId)
    expect(successResponse.ephemeral).toBe(false)
    expect(successResponse.content).toContain('✅')
    expect(successResponse.content).toContain('Données réinitialisées')

    // Check counts in response
    expect(successResponse.content).toContain('2 joueurs')
    expect(successResponse.content).toContain('1 duo')

    // Verify all data is cleared
    expect(testState.players.size).toBe(0)
    expect(testState.duos.size).toBe(0)
    expect(testState.games.size).toBe(0)
    expect(testState.devs.size).toBe(0)
  })

  it('should keep channels after reset', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Configure channels
    await config.set('generalChannelId', '123456789')
    await config.set('trackerChannelId', '987654321')

    // Add some data
    const player1 = player('user1').build()
    testState.players.set(player1.discordId, player1)

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    // Verify channels are kept
    expect(await config.get('generalChannelId')).toBe('123456789')
    expect(await config.get('trackerChannelId')).toBe('987654321')

    // Verify data is cleared
    expect(testState.players.size).toBe(0)
  })

  it('should keep event dates after reset', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Configure event dates
    await config.set('eventStartDate', '2025-11-01T00:00:00Z')
    await config.set('eventEndDate', '2025-11-30T23:59:59Z')
    await config.set('eventTimezone', 'America/New_York')

    // Add some data
    const player1 = player('user1').build()
    testState.players.set(player1.discordId, player1)

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(responses[0].content).toContain('Conservé')
    expect(responses[0].content).toContain('Dates de l\'événement')

    // Verify event config is kept
    expect(await config.get('eventStartDate')).toBe('2025-11-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-11-30T23:59:59Z')
    expect(await config.get('eventTimezone')).toBe('America/New_York')

    // Verify data is cleared
    expect(testState.players.size).toBe(0)
  })

  it('should keep API key after reset', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Configure API key
    await config.set('riotApiKey', 'RGAPI-test-key-123')

    // Add some data
    const player1 = player('user1').build()
    testState.players.set(player1.discordId, player1)

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(responses[0].content).toContain('Conservé')
    expect(responses[0].content).toContain('Clé API Riot')

    // Verify API key is kept
    expect(await config.get('riotApiKey')).toBe('RGAPI-test-key-123')

    // Verify data is cleared
    expect(testState.players.size).toBe(0)
  })

  it('should show correct counts before reset', async () => {
    const testState = state().build()

    // Add multiple players, duos, and games
    for (let i = 1; i <= 5; i++) {
      const p = player(`user${i}`).build()
      testState.players.set(p.discordId, p)
    }

    for (let i = 1; i <= 3; i++) {
      const d = duo(`user${i}`, `user${i + 1}`).withId(i).build()
      testState.duos.set(d.id, d)
    }

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const successResponse = responses[0]

    expect(successResponse.type).toBe(MessageType.SUCCESS)
    expect(successResponse.content).toContain('5 joueurs')
    expect(successResponse.content).toContain('3 duos')
    expect(successResponse.content).toContain('0 game')
  })

  it('should handle empty state gracefully', async () => {
    const testState = state().build()
    // No data added

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(responses[0].content).toContain('0 joueur')
    expect(responses[0].content).toContain('0 duo')
    expect(responses[0].content).toContain('0 game')
  })

  it('should verify all Maps are cleared', async () => {
    const testState = state().build()

    // Add data to all Maps
    const player1 = player('user1').build()
    const player2 = player('user2').build()
    const testDuo = duo('user1', 'user2').withId(1).build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)
    testState.duos.set(testDuo.id, testDuo)
    testState.devs.set('dev1', { userId: 'dev1', username: 'DevUser', registeredAt: new Date() })

    // Verify data is present
    expect(testState.players.size).toBe(2)
    expect(testState.duos.size).toBe(1)
    expect(testState.devs.size).toBe(1)

    const msg = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    // Verify ALL Maps are empty
    expect(testState.players.size).toBe(0)
    expect(testState.duos.size).toBe(0)
    expect(testState.games.size).toBe(0)
    expect(testState.devs.size).toBe(0)
  })
})
