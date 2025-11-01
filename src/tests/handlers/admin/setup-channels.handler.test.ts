/**
 * Tests pour setup-channels.handler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleSetupChannels } from '../../../handlers/admin/setup-channels.handler.js'
import { message, state } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'
import type { ConfigService } from '../../../services/config/index.js'

describe('handleSetupChannels', () => {
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  it('should configure both channels successfully', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '123456789',
      trackerChannelId: '987654321',
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    // Should have 3 responses: success + 2 test messages
    expect(responses).toHaveLength(3)

    // Check success response
    const successResponse = responses[0]
    expect(successResponse.type).toBe(MessageType.SUCCESS)
    expect(successResponse.targetId).toBe(msg.sourceId)
    expect(successResponse.content).toContain('✅')
    expect(successResponse.content).toContain('Channels configurés')
    expect(successResponse.content).toContain('123456789')
    expect(successResponse.content).toContain('987654321')

    // Check test messages in channels
    const generalTest = responses.find((r) => r.targetId === '123456789')
    expect(generalTest).toBeDefined()
    expect(generalTest?.content).toContain('interactions')

    const trackerTest = responses.find((r) => r.targetId === '987654321')
    expect(trackerTest).toBeDefined()
    expect(trackerTest?.content).toContain('notifications automatiques')

    // Check state was updated
    const config = testState.config as ConfigService
    expect(await config.get('generalChannelId')).toBe('123456789')
    expect(await config.get('trackerChannelId')).toBe('987654321')
  })

  it('should reject if channels are identical', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '123456789',
      trackerChannelId: '123456789', // Same ID
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    // Should have 1 error response
    expect(responses).toHaveLength(1)

    const errorResponse = responses[0]
    expect(errorResponse.type).toBe(MessageType.ERROR)
    expect(errorResponse.targetId).toBe(msg.sourceId)
    expect(errorResponse.content).toContain('différents')
    expect(errorResponse.ephemeral).toBe(true)

    // State should not be updated
    const config = testState.config as ConfigService
    expect(await config.get('generalChannelId')).toBeNull()
    expect(await config.get('trackerChannelId')).toBeNull()
  })

  it('should reject if generalChannelId is empty', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '',
      trackerChannelId: '987654321',
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('requis')
  })

  it('should reject if trackerChannelId is empty', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '123456789',
      trackerChannelId: '',
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('requis')
  })

  it('should reject if both channels are missing', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {}).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
  })

  it('should override previous channel configuration', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // First configuration
    await config.set('generalChannelId', '111111')
    await config.set('trackerChannelId', '222222')

    // Second configuration (override)
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '333333',
      trackerChannelId: '444444',
    }).build()

    await handleSetupChannels(msg, testState, responses)

    // Should succeed and override
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(await config.get('generalChannelId')).toBe('333333')
    expect(await config.get('trackerChannelId')).toBe('444444')
  })

  it('should send test message to general channel', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '123456789',
      trackerChannelId: '987654321',
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    const generalMessage = responses.find((r) => r.targetId === '123456789')

    expect(generalMessage).toBeDefined()
    expect(generalMessage?.type).toBe(MessageType.INFO)
    expect(generalMessage?.content).toContain('✅')
    expect(generalMessage?.content).toContain('interactions')
    expect(generalMessage?.ephemeral).toBe(false)
  })

  it('should send test message to tracker channel', async () => {
    const msg = message(MessageType.SETUP_CHANNELS, {
      generalChannelId: '123456789',
      trackerChannelId: '987654321',
    }).build()

    const testState = state().build()

    await handleSetupChannels(msg, testState, responses)

    const trackerMessage = responses.find((r) => r.targetId === '987654321')

    expect(trackerMessage).toBeDefined()
    expect(trackerMessage?.type).toBe(MessageType.INFO)
    expect(trackerMessage?.content).toContain('✅')
    expect(trackerMessage?.content).toContain('notifications automatiques')
    expect(trackerMessage?.content).toMatch(/games|ladder/)
    expect(trackerMessage?.ephemeral).toBe(false)
  })
})
