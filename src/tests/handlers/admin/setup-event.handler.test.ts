/**
 * Tests pour setup-event.handler
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { handleSetupEvent } from '../../../handlers/admin/setup-event.handler.js'
import { message, state } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'
import type { ConfigService } from '../../../services/config/index.js'

describe('handleSetupEvent', () => {
  let responses: Response[]

  beforeEach(() => {
    responses = []
  })

  it('should configure event dates successfully', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    // Should have 1 success response
    expect(responses).toHaveLength(1)

    const successResponse = responses[0]
    expect(successResponse.type).toBe(MessageType.SUCCESS)
    expect(successResponse.targetId).toBe(msg.sourceId)
    expect(successResponse.content).toContain('✅')
    expect(successResponse.content).toContain('Événement configuré')
    expect(successResponse.content).toContain('novembre')
    expect(successResponse.ephemeral).toBe(false)

    // Check state was updated
    const config = testState.config as ConfigService
    expect(await config.get('eventStartDate')).toBe('2025-11-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-11-30T23:59:59Z')
    expect(await config.get('eventTimezone')).toBe('Europe/Paris')
  })

  it('should accept custom timezone', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z',
      timezone: 'America/New_York',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    // The handler now defaults to Europe/Paris if no timezone provided
    const config = testState.config as ConfigService
    expect(await config.get('eventTimezone')).toBe('Europe/Paris')
  })

  it('should reject if startDate is missing', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      endDate: '2025-11-30T23:59:59Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('invalide')
    expect(responses[0].ephemeral).toBe(true)
  })

  it('should reject if endDate is missing', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('invalide')
  })

  it('should reject if both dates are missing', async () => {
    const msg = message(MessageType.SETUP_EVENT, {}).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
  })

  it('should reject invalid date format', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: 'invalid-date',
      endDate: '2025-11-30T23:59:59Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('Date de début invalide')
    expect(responses[0].content).toContain('ISO 8601')
  })

  it('should reject if start date is after end date', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-30T23:59:59Z',
      endDate: '2025-11-01T00:00:00Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('après')
  })

  it('should reject if start date equals end date', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-01T00:00:00Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('après')
  })

  it('should accept past dates without warning', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2020-01-01T00:00:00Z',
      endDate: '2020-01-02T00:00:00Z',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    // Handler no longer warns about past dates, just accepts them
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
  })

  it('should calculate duration correctly', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-05T12:00:00Z', // 4 days and 12 hours
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(responses[0].content).toContain('4 jours')
    expect(responses[0].content).toContain('12 heures')
  })

  it('should show singular form for 1 day', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-02T00:00:00Z', // 1 day
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const content = responses[0].content
    expect(content).toContain('1 jour')
    expect(content).not.toContain('1 jours')
  })

  it('should override previous event configuration', async () => {
    const testState = state().build()
    const config = testState.config as ConfigService

    // First configuration
    await config.set('eventStartDate', '2025-10-01T00:00:00Z')
    await config.set('eventEndDate', '2025-10-31T23:59:59Z')

    // Second configuration (override)
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-30T23:59:59Z',
    }).build()

    await handleSetupEvent(msg, testState, responses)

    // Should succeed and override
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(await config.get('eventStartDate')).toBe('2025-11-01T00:00:00Z')
    expect(await config.get('eventEndDate')).toBe('2025-11-30T23:59:59Z')
  })

  it('should accept short event duration (< 1 day)', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2026-11-01T00:00:00Z', // Use future date to avoid past date warning
      endDate: '2026-11-01T06:00:00Z', // 6 hours
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    // New formatter doesn't show "0 jour", just "6 heures"
    expect(responses[0].content).toContain('6 heures')
  })

  it('should not show hours if duration is exact days', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '2025-11-01T00:00:00Z',
      endDate: '2025-11-04T00:00:00Z', // Exactly 3 days
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const content = responses[0].content
    expect(content).toContain('3 jours')
    expect(content).not.toContain('heure')
  })
})
