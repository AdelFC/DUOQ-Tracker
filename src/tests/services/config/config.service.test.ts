/**
 * Tests pour ConfigService
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConfigService } from '../../../services/config/config.service.js'

describe('ConfigService', () => {
  let config: ConfigService

  beforeEach(() => {
    config = new ConfigService()
  })

  describe('get/set', () => {
    it('should return null for unset key', async () => {
      const value = await config.get('eventStartDate')
      expect(value).toBeNull()
    })

    it('should set and get a value', async () => {
      await config.set('eventStartDate', '2025-11-05T00:00:00Z')
      const value = await config.get('eventStartDate')
      expect(value).toBe('2025-11-05T00:00:00Z')
    })

    it('should override existing value', async () => {
      await config.set('eventStartDate', '2025-11-01T00:00:00Z')
      await config.set('eventStartDate', '2025-11-05T00:00:00Z')
      const value = await config.get('eventStartDate')
      expect(value).toBe('2025-11-05T00:00:00Z')
    })

    it('should delete a value', async () => {
      await config.set('eventStartDate', '2025-11-05T00:00:00Z')
      await config.delete('eventStartDate')
      const value = await config.get('eventStartDate')
      expect(value).toBeNull()
    })
  })

  describe('getConfig', () => {
    it('should return default config with null values', async () => {
      const cfg = await config.getConfig()

      expect(cfg).toMatchObject({
        eventStartDate: null,
        eventEndDate: null,
        eventTimezone: 'Europe/Paris',
        generalChannelId: null,
        trackerChannelId: null,
        riotApiKey: null,
        lastApiKeyReminder: null,
        isActive: false,
      })
    })

    it('should return full config with all values set', async () => {
      await config.set('eventStartDate', '2025-11-05T00:00:00Z')
      await config.set('eventEndDate', '2025-11-10T23:59:59Z')
      await config.set('generalChannelId', '123456')
      await config.set('trackerChannelId', '789012')
      await config.set('riotApiKey', 'RGAPI-test')

      const cfg = await config.getConfig()

      expect(cfg.eventStartDate).toBe('2025-11-05T00:00:00Z')
      expect(cfg.eventEndDate).toBe('2025-11-10T23:59:59Z')
      expect(cfg.generalChannelId).toBe('123456')
      expect(cfg.trackerChannelId).toBe('789012')
      expect(cfg.riotApiKey).toBe('RGAPI-test')
    })
  })

  describe('setEventDates', () => {
    it('should set event dates', async () => {
      await config.setEventDates('2025-11-05T00:00:00Z', '2025-11-10T23:59:59Z')

      const startDate = await config.get('eventStartDate')
      const endDate = await config.get('eventEndDate')

      expect(startDate).toBe('2025-11-05T00:00:00Z')
      expect(endDate).toBe('2025-11-10T23:59:59Z')
    })

    it('should set event dates with custom timezone', async () => {
      await config.setEventDates(
        '2025-11-05T00:00:00Z',
        '2025-11-10T23:59:59Z',
        'America/New_York'
      )

      const timezone = await config.get('eventTimezone')
      expect(timezone).toBe('America/New_York')
    })

    it('should keep default timezone if not provided', async () => {
      await config.setEventDates('2025-11-05T00:00:00Z', '2025-11-10T23:59:59Z')

      const timezone = await config.get('eventTimezone')
      expect(timezone).toBe('Europe/Paris')
    })
  })

  describe('setChannels', () => {
    it('should set both channels', async () => {
      await config.setChannels('123456', '789012')

      const general = await config.get('generalChannelId')
      const tracker = await config.get('trackerChannelId')

      expect(general).toBe('123456')
      expect(tracker).toBe('789012')
    })
  })

  describe('isEventActive', () => {
    it('should return false if no dates set', async () => {
      const isActive = await config.isEventActive()
      expect(isActive).toBe(false)
    })

    it('should return false if only start date set', async () => {
      await config.set('eventStartDate', '2025-11-05T00:00:00Z')
      const isActive = await config.isEventActive()
      expect(isActive).toBe(false)
    })

    it('should return false if only end date set', async () => {
      await config.set('eventEndDate', '2025-11-10T23:59:59Z')
      const isActive = await config.isEventActive()
      expect(isActive).toBe(false)
    })

    it('should return true if event is currently active', async () => {
      // Event started 1 day ago, ends in 4 days
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const in4Days = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000)

      await config.setEventDates(yesterday.toISOString(), in4Days.toISOString())

      const isActive = await config.isEventActive()
      expect(isActive).toBe(true)
    })

    it('should return false if event not started yet', async () => {
      // Event starts in 2 days, ends in 7 days
      const now = new Date()
      const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
      const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      await config.setEventDates(in2Days.toISOString(), in7Days.toISOString())

      const isActive = await config.isEventActive()
      expect(isActive).toBe(false)
    })

    it('should return false if event already ended', async () => {
      // Event started 7 days ago, ended 2 days ago
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)

      await config.setEventDates(sevenDaysAgo.toISOString(), twoDaysAgo.toISOString())

      const isActive = await config.isEventActive()
      expect(isActive).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all config except channels by default', async () => {
      await config.setEventDates('2025-11-05T00:00:00Z', '2025-11-10T23:59:59Z')
      await config.setChannels('123456', '789012')
      await config.set('riotApiKey', 'RGAPI-test')

      await config.reset()

      const eventStart = await config.get('eventStartDate')
      const eventEnd = await config.get('eventEndDate')
      const apiKey = await config.get('riotApiKey')
      const general = await config.get('generalChannelId')
      const tracker = await config.get('trackerChannelId')

      expect(eventStart).toBeNull()
      expect(eventEnd).toBeNull()
      expect(apiKey).toBeNull()
      expect(general).toBe('123456') // Preserved
      expect(tracker).toBe('789012') // Preserved
    })

    it('should reset all config including channels if keepChannels=false', async () => {
      await config.setEventDates('2025-11-05T00:00:00Z', '2025-11-10T23:59:59Z')
      await config.setChannels('123456', '789012')

      await config.reset(false)

      const general = await config.get('generalChannelId')
      const tracker = await config.get('trackerChannelId')

      expect(general).toBeNull()
      expect(tracker).toBeNull()
    })

    it('should restore default timezone after reset', async () => {
      await config.set('eventTimezone', 'America/New_York')
      await config.reset()

      const timezone = await config.get('eventTimezone')
      expect(timezone).toBe('Europe/Paris')
    })
  })
})
