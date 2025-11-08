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

  it('should configure event dates successfully with new format', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '00:00',
      endDate: '30/11/2025',
      endHour: '23:59',
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

    // Check state was updated (stored as ISO strings)
    const config = testState.config as ConfigService
    const storedStart = await config.get('eventStartDate')
    const storedEnd = await config.get('eventEndDate')

    expect(storedStart).toBeTruthy()
    expect(storedEnd).toBeTruthy()
    expect(await config.get('eventTimezone')).toBe('Europe/Paris')
  })

  it('should always use Europe/Paris timezone', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '10:00',
      endDate: '30/11/2025',
      endHour: '20:00',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const config = testState.config as ConfigService
    expect(await config.get('eventTimezone')).toBe('Europe/Paris')
  })

  it('should reject if startDate is missing', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startHour: '00:00',
      endDate: '30/11/2025',
      endHour: '23:59',
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
      startDate: '1/11/2025',
      startHour: '00:00',
      endHour: '23:59',
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
      startHour: '00:00',
      endDate: '30/11/2025',
      endHour: '23:59',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('Date de début')
    expect(responses[0].content).toContain('invalide')
  })

  it('should reject invalid hour format', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '25:00', // Invalid hour
      endDate: '30/11/2025',
      endHour: '23:59',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('heure invalide')
  })

  it('should reject impossible dates like 31/02/2025', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '31/02/2025', // Impossible date
      startHour: '00:00',
      endDate: '30/11/2025',
      endHour: '23:59',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('Date invalide')
  })

  it('should reject if start date is after end date', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '30/11/2025',
      startHour: '23:59',
      endDate: '1/11/2025',
      endHour: '00:00',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('après')
  })

  it('should reject if start date equals end date and time', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '12:00',
      endDate: '1/11/2025',
      endHour: '12:00',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.ERROR)
    expect(responses[0].content).toContain('après')
  })

  it('should accept past dates without warning', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/01/2020',
      startHour: '00:00',
      endDate: '2/01/2020',
      endHour: '00:00',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    // Handler no longer warns about past dates, just accepts them
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
  })

  it('should calculate duration correctly', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '00:00',
      endDate: '5/11/2025',
      endHour: '12:00', // 4 days and 12 hours
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
      startDate: '1/11/2025',
      startHour: '00:00',
      endDate: '2/11/2025',
      endHour: '00:00', // 1 day
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
    await config.set('eventStartDate', '2025-10-01T00:00:00.000Z')
    await config.set('eventEndDate', '2025-10-31T23:59:59.000Z')

    // Second configuration (override)
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '00:00',
      endDate: '30/11/2025',
      endHour: '23:59',
    }).build()

    await handleSetupEvent(msg, testState, responses)

    // Should succeed and override
    expect(responses[0].type).toBe(MessageType.SUCCESS)

    const newStart = await config.get('eventStartDate')
    const newEnd = await config.get('eventEndDate')
    expect(newStart).toBeTruthy()
    expect(newEnd).toBeTruthy()
    expect(newStart).not.toBe('2025-10-01T00:00:00.000Z')
  })

  it('should accept short event duration (< 1 day)', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2026',
      startHour: '00:00',
      endDate: '1/11/2026',
      endHour: '06:00', // 6 hours
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
    expect(responses[0].content).toContain('6 heures')
  })

  it('should not show hours if duration is exact days', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/11/2025',
      startHour: '00:00',
      endDate: '4/11/2025',
      endHour: '00:00', // Exactly 3 days
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    const content = responses[0].content
    expect(content).toContain('3 jours')
    expect(content).not.toContain('heure')
  })

  it('should accept single-digit dates and hours', async () => {
    const msg = message(MessageType.SETUP_EVENT, {
      startDate: '1/1/2025',
      startHour: '9:00',
      endDate: '5/1/2025',
      endHour: '18:30',
    }).build()

    const testState = state().build()

    await handleSetupEvent(msg, testState, responses)

    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.SUCCESS)
  })
})
