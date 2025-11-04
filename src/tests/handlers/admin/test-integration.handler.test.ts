/**
 * Tests pour test-integration.handler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleTestIntegration } from '../../../handlers/admin/test-integration.handler.js'
import { message, state } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'

describe('handleTestIntegration', () => {
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  it('should generate 21 test responses (10 tests × 2 + 1 summary)', async () => {
    const msg = message(MessageType.TEST_INTEGRATION, {}).build()
    const testState = state().build()

    await handleTestIntegration(msg, testState, responses)

    // 10 test headers + 10 test embeds + 1 summary = 21 responses
    expect(responses).toHaveLength(21)
  })

  it('should include all embed types', async () => {
    const msg = message(MessageType.TEST_INTEGRATION, {}).build()
    const testState = state().build()

    await handleTestIntegration(msg, testState, responses)

    // Parse all embed contents
    const embedContents = responses.map((r) => {
      try {
        return JSON.parse(r.content)
      } catch {
        return null
      }
    })

    // Check for key embeds by title
    const titles = embedContents.map((e) => e?.title || '').join('|')

    expect(titles).toContain('Setup Channels')
    expect(titles).toContain('Setup Event')
    expect(titles).toContain('Setup Status')
    expect(titles).toContain('Register Player')
    expect(titles).toContain('Game terminée détectée')
    expect(titles).toContain('Player Profile')
    expect(titles).toContain('Duo Stats')
    expect(titles).toContain('Ladder')
    expect(titles).toContain('History')
    expect(titles).toContain('Daily Ladder')
    expect(titles).toContain('Tests d\'intégration terminés')
  })

  it('should send all responses to source (ephemeral: false)', async () => {
    const msg = message(MessageType.TEST_INTEGRATION, {}).build()
    const testState = state().build()

    await handleTestIntegration(msg, testState, responses)

    // All responses should go to the source who triggered the test
    responses.forEach((r) => {
      expect(r.targetId).toBe(msg.sourceId)
      expect(r.ephemeral).toBe(false)
    })
  })

  it('should include final success summary', async () => {
    const msg = message(MessageType.TEST_INTEGRATION, {}).build()
    const testState = state().build()

    await handleTestIntegration(msg, testState, responses)

    // Last response should be the summary
    const lastResponse = responses[responses.length - 1]
    expect(lastResponse.type).toBe(MessageType.SUCCESS)

    const summary = JSON.parse(lastResponse.content)
    expect(summary.title).toContain('Tests d\'intégration terminés')
    expect(summary.description).toContain('10 tests')
    expect(summary.description).toContain('production')
  })

  it('should format all embeds as valid JSON', async () => {
    const msg = message(MessageType.TEST_INTEGRATION, {}).build()
    const testState = state().build()

    await handleTestIntegration(msg, testState, responses)

    // All responses should have valid JSON content
    responses.forEach((r, index) => {
      expect(() => JSON.parse(r.content)).not.toThrow(
        `Response ${index} should have valid JSON content`
      )
    })
  })
})
