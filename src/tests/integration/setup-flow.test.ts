/**
 * Integration Tests for /setup Command Flow
 * Tests the complete setup workflow end-to-end
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleSetupChannels } from '../../handlers/admin/setup-channels.handler.js'
import { handleSetupEvent } from '../../handlers/admin/setup-event.handler.js'
import { handleSetupStatus } from '../../handlers/admin/setup-status.handler.js'
import { handleSetupReset } from '../../handlers/admin/setup-reset.handler.js'
import { message, state, player, duo } from '../fixtures/builders.js'
import { MessageType } from '../../types/message.js'
import type { Response } from '../../types/message.js'
import type { ConfigService } from '../../services/config/index.js'
import type { State } from '../../types/state.js'

describe('Setup Flow Integration Tests', () => {
  let testState: State
  let responses: Response[]

  beforeEach(() => {
    testState = state().build()
    responses = []
  })

  it('should complete full setup workflow: channels → event → status', async () => {
    // Step 1: Configure channels
    const channelsMsg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '111111',
      trackerChannelId: '222222',
    }).build()

    await handleSetupChannels(channelsMsg, testState, responses)

    // Verify channels configured
    expect(responses).toHaveLength(3) // success + 2 test messages
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const config = testState.config as ConfigService
    expect(await config.get('generalChannelId')).toBe('111111')
    expect(await config.get('trackerChannelId')).toBe('222222')

    // Clear responses for next step
    responses = []

    // Step 2: Configure event dates
    const startDate = new Date('2025-11-01T00:00:00Z')
    const endDate = new Date('2025-11-15T23:59:59Z')

    const eventMsg = message(MessageType.SETUP_EVENT, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      timezone: 'Europe/Paris',
    }).build()

    await handleSetupEvent(eventMsg, testState, responses)

    // Verify event configured
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const embed = JSON.parse(responses[0].content)
    expect(embed.title).toContain('Événement configuré')

    expect(await config.get('eventStartDate')).toBe(startDate.toISOString())
    expect(await config.get('eventEndDate')).toBe(endDate.toISOString())
    expect(await config.get('eventTimezone')).toBe('Europe/Paris')

    // Set API key to make setup complete
    await config.set('riotApiKey', 'RGAPI-test-key')

    // Clear responses for next step
    responses = []

    // Step 3: Check setup status
    const statusMsg = message(MessageType.SETUP_STATUS, {}).build()

    await handleSetupStatus(statusMsg, testState, responses)

    // Verify status shows complete setup
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.INFO)

    const statusEmbed = JSON.parse(responses[0].content)
    expect(statusEmbed.title).toContain('Configuration du Bot')
    expect(statusEmbed.description).toContain('entièrement configuré')

    // Should have 4 fields: channels, event, stats, API key
    expect(statusEmbed.fields).toHaveLength(4)

    const channelsField = statusEmbed.fields.find((f: any) =>
      f.name.includes('Channels')
    )
    expect(channelsField).toBeDefined()
    expect(channelsField.value).toContain('<#111111>')
    expect(channelsField.value).toContain('<#222222>')

    const eventField = statusEmbed.fields.find((f: any) =>
      f.name.includes('Événement')
    )
    expect(eventField).toBeDefined()
    expect(eventField.value).toContain('Europe/Paris')
  })

  it('should handle partial setup (only channels)', async () => {
    // Configure only channels, no event
    const channelsMsg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '333333',
      trackerChannelId: '444444',
    }).build()

    await handleSetupChannels(channelsMsg, testState, responses)

    responses = []

    // Check status with partial setup
    const statusMsg = message(MessageType.SETUP_STATUS, {}).build()

    await handleSetupStatus(statusMsg, testState, responses)

    const statusEmbed = JSON.parse(responses[0].content)

    // Should show warning about incomplete setup
    expect(statusEmbed.description).toContain('incomplète')

    // Should have 4 fields (channels, event, stats, API key - event and API key not configured)
    expect(statusEmbed.fields).toHaveLength(4)
    const channelsField = statusEmbed.fields.find((f: any) => f.name.includes('Channels'))
    expect(channelsField).toBeDefined()
    expect(channelsField.value).toContain('<#333333>')

    const eventField = statusEmbed.fields.find((f: any) => f.name.includes('Événement'))
    expect(eventField).toBeDefined()
    expect(eventField.value).toContain('Non configuré')
  })

  it('should handle partial setup (only event)', async () => {
    // Configure only event, no channels
    const startDate = new Date('2025-12-01T00:00:00Z')
    const endDate = new Date('2025-12-31T23:59:59Z')

    const eventMsg = message(MessageType.SETUP_EVENT, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }).build()

    await handleSetupEvent(eventMsg, testState, responses)

    responses = []

    // Check status
    const statusMsg = message(MessageType.SETUP_STATUS, {}).build()

    await handleSetupStatus(statusMsg, testState, responses)

    const statusEmbed = JSON.parse(responses[0].content)

    // Should show warning about incomplete setup
    expect(statusEmbed.description).toContain('incomplète')

    // Should have 4 fields (channels, event, stats, API key - channels and API key not configured)
    expect(statusEmbed.fields).toHaveLength(4)
    const channelsField = statusEmbed.fields.find((f: any) => f.name.includes('Channels'))
    expect(channelsField).toBeDefined()
    expect(channelsField.value).toContain('Non configurés')

    const eventField = statusEmbed.fields.find((f: any) => f.name.includes('Événement'))
    expect(eventField).toBeDefined()
    // Event is configured, so it should show active status
    expect(eventField.value).toMatch(/🟢|⏳/)
  })

  it('should reset event data while preserving configuration', async () => {
    // Step 1: Setup channels and event
    const channelsMsg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '555555',
      trackerChannelId: '666666',
    }).build()

    await handleSetupChannels(channelsMsg, testState, responses)

    const eventMsg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z',
    }).build()

    await handleSetupEvent(eventMsg, testState, responses)

    // Step 2: Add some data (players, duos, games)
    const player1 = player().withDiscordId('player1').withGameName('Player1').build()
    const player2 = player().withDiscordId('player2').withGameName('Player2').build()
    const player3 = player().withDiscordId('player3').withGameName('Player3').build()
    const player4 = player().withDiscordId('player4').withGameName('Player4').build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)
    testState.players.set(player3.discordId, player3)
    testState.players.set(player4.discordId, player4)

    const duo1 = duo()
      .withName('Duo1')
      .withNoob(player1.discordId)
      .withCarry(player2.discordId)
      .build()
    const duo2 = duo()
      .withName('Duo2')
      .withNoob(player3.discordId)
      .withCarry(player4.discordId)
      .build()

    testState.duos.set(duo1.id, duo1)
    testState.duos.set(duo2.id, duo2)

    // Add a fake game
    testState.games.set('game1', {
      id: 'game1',
      duoId: duo1.id,
      riotGameId: 'riot123',
      startTime: new Date(),
      endTime: null,
      isActive: true,
      result: null,
      pointsAwarded: 0,
      detectedAt: new Date(),
    })

    // Verify data exists
    expect(testState.players.size).toBe(4)
    expect(testState.duos.size).toBe(2)
    expect(testState.games.size).toBe(1)

    responses = []

    // Step 3: Reset without confirmation (should fail)
    const resetMsgNoConfirm = message(MessageType.SETUP_RESET, {}).build()

    await handleSetupReset(resetMsgNoConfirm, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('ATTENTION')
    expect(responses[0].ephemeral).toBe(true)

    // Data should still exist
    expect(testState.players.size).toBe(4)
    expect(testState.duos.size).toBe(2)
    expect(testState.games.size).toBe(1)

    responses = []

    // Step 4: Reset with confirmation
    const resetMsgConfirm = message(MessageType.SETUP_RESET, {
      confirm: true,
    }).build()

    await handleSetupReset(resetMsgConfirm, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const resetEmbed = JSON.parse(responses[0].content)
    expect(resetEmbed.title).toContain('Données réinitialisées')

    // Check the fields for deleted data count
    const deletedField = resetEmbed.fields.find((f: any) => f.name.includes('Données supprimées'))
    expect(deletedField).toBeDefined()
    expect(deletedField.value).toContain('4 joueur')
    expect(deletedField.value).toContain('2 duo')
    expect(deletedField.value).toContain('1 game')

    // Data should be cleared
    expect(testState.players.size).toBe(0)
    expect(testState.duos.size).toBe(0)
    expect(testState.games.size).toBe(0)

    // Configuration should be preserved
    const config = testState.config as ConfigService
    expect(await config.get('generalChannelId')).toBe('555555')
    expect(await config.get('trackerChannelId')).toBe('666666')
    expect(await config.get('eventStartDate')).toBe('2025-11-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-11-30T23:59:59Z')
  })

  it('should handle event reconfiguration (override)', async () => {
    // Initial event setup
    const firstEventMsg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-15T23:59:59Z',
      timezone: 'Europe/Paris',
    }).build()

    await handleSetupEvent(firstEventMsg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const config = testState.config as ConfigService
    expect(await config.get('eventStartDate')).toBe('2025-11-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-11-15T23:59:59Z')

    responses = []

    // Reconfigure with new dates
    const secondEventMsg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-12-01T00:00:00Z',
      endDate: '2025-12-31T23:59:59Z',
      timezone: 'America/New_York',
    }).build()

    await handleSetupEvent(secondEventMsg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    // Configuration should be updated
    expect(await config.get('eventStartDate')).toBe('2025-12-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-12-31T23:59:59Z')
    expect(await config.get('eventTimezone')).toBe('America/New_York')

    // Check status to verify override
    responses = []

    const statusMsg = message(MessageType.SETUP_STATUS, {}).build()
    await handleSetupStatus(statusMsg, testState, responses)

    const statusEmbed = JSON.parse(responses[0].content)
    const eventField = statusEmbed.fields.find((f: any) =>
      f.name.includes('Événement')
    )

    // New formatter shows dates without "Début" and "Fin" labels, just the formatted dates
    expect(eventField.value).toContain('America/New_York')
    // Should show formatted dates
    expect(eventField.value).toMatch(/déc|30 nov/)
  })
})
