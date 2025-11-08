/**
 * Tests pour setup-status.handler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleSetupStatus } from '../../../handlers/admin/setup-status.handler.js'
import { message, state, player, duo } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'
import type { ConfigService } from '../../../services/config/index.js'

describe('handleSetupStatus', () => {
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  it('should display full configuration with all fields', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Configure everything (including devChannelId)
    await config.set('generalChannelId', '123456789')
    await config.set('trackerChannelId', '987654321')
    await config.set('devChannelId', '555555555')
    await config.set('eventStartDate', '2025-11-01T00:00:00Z')
    await config.set('eventEndDate', '2025-11-30T23:59:59Z')
    await config.set('eventTimezone', 'Europe/Paris')
    await config.set('riotApiKey', 'RGAPI-test-key-123')

    const msg = message(MessageType.SETUP_STATUS).build()

    await handleSetupStatus(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const statusResponse = responses[0]

    expect(statusResponse.type).toBe(MessageType.INFO)
    expect(statusResponse.targetId).toBe(msg.sourceId)
    expect(statusResponse.ephemeral).toBe(false)

    // Parse the embed JSON
    const embed = JSON.parse(statusResponse.content)

    // Check embed structure
    expect(embed.title).toContain('Configuration du Bot')
    expect(embed.description).toContain('entièrement configuré')
    expect(embed.fields).toHaveLength(4) // Channels, Event, Stats, API Key

    // Check channels field
    const channelsField = embed.fields.find((f: any) => f.name.includes('Channels'))
    expect(channelsField).toBeDefined()
    expect(channelsField.value).toContain('<#123456789>')
    expect(channelsField.value).toContain('<#987654321>')
    expect(channelsField.value).toContain('<#555555555>')

    // Check event field
    const eventField = embed.fields.find((f: any) => f.name.includes('Événement'))
    expect(eventField).toBeDefined()
    expect(eventField.value).toContain('Europe/Paris')

    // Check stats field
    const statsField = embed.fields.find((f: any) => f.name.includes('Statistiques'))
    expect(statsField).toBeDefined()

    // Check API key field
    const apiKeyField = embed.fields.find((f: any) => f.name.includes('Clé API'))
    expect(apiKeyField).toBeDefined()
    expect(apiKeyField.value).toContain('Configurée')
  })

  it('should display config with missing fields', async () => {
    const testState = state().build()
    // Don't configure anything

    const msg = message(MessageType.SETUP_STATUS).build()

    await handleSetupStatus(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const statusResponse = responses[0]

    expect(statusResponse.type).toBe(MessageType.INFO)

    // Parse the embed JSON
    const embed = JSON.parse(statusResponse.content)

    // Check embed shows incomplete config
    expect(embed.description).toContain('incomplète')
    expect(embed.fields).toHaveLength(4) // Still has 4 fields, but some show "Non configuré"

    // Check channels field shows not configured
    const channelsField = embed.fields.find((f: any) => f.name.includes('Channels'))
    expect(channelsField.value).toContain('Non configurés')
  })

  it('should show correct active status when event is active', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Set event dates to be active now
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    await config.set('eventStartDate', yesterday.toISOString())
    await config.set('eventEndDate', tomorrow.toISOString())

    const msg = message(MessageType.SETUP_STATUS).build()

    await handleSetupStatus(msg, testState, responses)

    expect(responses).toHaveLength(1)

    // Parse the embed JSON
    const embed = JSON.parse(responses[0].content)

    // Check event field shows active status
    const eventField = embed.fields.find((f: any) => f.name.includes('Événement'))
    expect(eventField.value).toContain('🟢')
    expect(eventField.value).toContain('Actif')
  })

  it('should show correct inactive status when event is not active', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // Set event dates in the future
    await config.set('eventStartDate', '2030-11-01T00:00:00Z')
    await config.set('eventEndDate', '2030-11-30T23:59:59Z')

    const msg = message(MessageType.SETUP_STATUS).build()

    await handleSetupStatus(msg, testState, responses)

    expect(responses).toHaveLength(1)

    // Parse the embed JSON
    const embed = JSON.parse(responses[0].content)

    // Check event field shows inactive status
    const eventField = embed.fields.find((f: any) => f.name.includes('Événement'))
    expect(eventField.value).toContain('⏳')
    expect(eventField.value).toContain('Pas encore commencé')
  })

  it('should display player/duo/game statistics', async () => {
    const testState = state().build()

    // Add some test data
    const player1 = player('user1').withGameName('Player1', 'EUW').asNoob().build()
    const player2 = player('user2').withGameName('Player2', 'EUW').asCarry().build()
    const testDuo = duo('user1', 'user2').withId(1).build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)
    testState.duos.set(testDuo.id, testDuo)

    const msg = message(MessageType.SETUP_STATUS).build()

    await handleSetupStatus(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const statusResponse = responses[0]

    // Parse the embed JSON
    const embed = JSON.parse(statusResponse.content)

    // Embed should have title and description
    expect(embed.title).toContain('Configuration')
    expect(embed.fields).toHaveLength(4) // Channels + Event + Stats + API Key

    // Check stats field shows correct counts
    const statsField = embed.fields.find((f: any) => f.name.includes('Statistiques'))
    expect(statsField).toBeDefined()
    expect(statsField.value).toContain('2 joueurs')
    expect(statsField.value).toContain('1 duo')
  })
})
