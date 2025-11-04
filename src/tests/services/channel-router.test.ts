/**
 * Tests pour Channel Router
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ChannelRouter } from '../../services/channel-router.js'
import { ConfigService } from '../../services/config/index.js'
import { MessageType } from '../../types/message.js'
import type { Response } from '../../types/message.js'

describe('ChannelRouter', () => {
  let router: ChannelRouter
  let config: ConfigService

  beforeEach(() => {
    config = new ConfigService()
    router = new ChannelRouter(config)
  })

  describe('route()', () => {
    it('should route REGISTER to general channel', async () => {
      const response: Response = {
        type: MessageType.REGISTER,
        targetId: 'user123',
        content: 'Registration successful',
      }

      const routed = await router.route(response)

      expect(routed.channel).toBe('general')
      expect(routed.type).toBe(MessageType.REGISTER)
    })

    it('should route GAME_DETECTED to tracker channel', async () => {
      const response: Response = {
        type: MessageType.GAME_DETECTED,
        targetId: 'user123',
        content: 'Game detected',
      }

      const routed = await router.route(response)

      expect(routed.channel).toBe('tracker')
    })

    it('should route LADDER to tracker channel', async () => {
      const response: Response = {
        type: MessageType.LADDER,
        targetId: 'user123',
        content: 'Current ladder',
      }

      const routed = await router.route(response)

      expect(routed.channel).toBe('tracker')
    })

    it('should route ephemeral messages to source', async () => {
      const response: Response = {
        type: MessageType.ERROR,
        targetId: 'user123',
        content: 'Error message',
        ephemeral: true,
      }

      const routed = await router.route(response)

      expect(routed.channel).toBe('source')
    })

    it('should route SETUP_CHANNELS to source', async () => {
      const response: Response = {
        type: MessageType.SETUP_CHANNELS,
        targetId: 'admin123',
        content: 'Channels configured',
      }

      const routed = await router.route(response)

      expect(routed.channel).toBe('source')
    })

    it('should route user commands to general channel', async () => {
      const userCommands = [
        MessageType.REGISTER,
        MessageType.UNREGISTER,
        MessageType.LINK_ACCOUNT,
        MessageType.STATS,
        MessageType.HISTORY,
        MessageType.DUO_STATS,
      ]

      for (const type of userCommands) {
        const response: Response = {
          type,
          targetId: 'user123',
          content: 'Test',
        }

        const routed = await router.route(response)
        expect(routed.channel).toBe('general')
      }
    })

    it('should route game notifications to tracker channel', async () => {
      const gameTypes = [MessageType.GAME_DETECTED, MessageType.GAME_SCORED]

      for (const type of gameTypes) {
        const response: Response = {
          type,
          targetId: 'user123',
          content: 'Test',
        }

        const routed = await router.route(response)
        expect(routed.channel).toBe('tracker')
      }
    })
  })

  describe('getChannelId()', () => {
    it('should return configured general channel ID', async () => {
      await config.set('generalChannelId', '123456789')

      const channelId = await router.getChannelId('general')

      expect(channelId).toBe('123456789')
    })

    it('should return configured tracker channel ID', async () => {
      await config.set('trackerChannelId', '987654321')

      const channelId = await router.getChannelId('tracker')

      expect(channelId).toBe('987654321')
    })

    it('should return source ID for source channel', async () => {
      const channelId = await router.getChannelId('source', 'user123')

      expect(channelId).toBe('user123')
    })

    it('should return null for unconfigured channel', async () => {
      // Don't configure any channels

      const generalId = await router.getChannelId('general')
      const trackerId = await router.getChannelId('tracker')

      expect(generalId).toBeNull()
      expect(trackerId).toBeNull()
    })
  })

  describe('applyRouting()', () => {
    beforeEach(async () => {
      await config.set('generalChannelId', '123456789')
      await config.set('trackerChannelId', '987654321')
    })

    it('should update targetId for general channel', async () => {
      const response: Response = {
        type: MessageType.REGISTER,
        targetId: 'user123',
        content: 'Test',
      }

      const routed = await router.applyRouting(response)

      expect(routed.targetId).toBe('123456789')
    })

    it('should update targetId for tracker channel', async () => {
      const response: Response = {
        type: MessageType.GAME_DETECTED,
        targetId: 'user123',
        content: 'Test',
      }

      const routed = await router.applyRouting(response)

      expect(routed.targetId).toBe('987654321')
    })

    it('should keep original targetId for source channel', async () => {
      const response: Response = {
        type: MessageType.SETUP_STATUS,
        targetId: 'admin123',
        content: 'Test',
      }

      const routed = await router.applyRouting(response)

      expect(routed.targetId).toBe('admin123')
    })

    it('should keep original targetId if channel not configured', async () => {
      // Clear config
      await config.delete('generalChannelId')

      const response: Response = {
        type: MessageType.REGISTER,
        targetId: 'user123',
        content: 'Test',
      }

      const routed = await router.applyRouting(response)

      expect(routed.targetId).toBe('user123')
    })

    it('should keep ephemeral flag', async () => {
      const response: Response = {
        type: MessageType.ERROR,
        targetId: 'user123',
        content: 'Error',
        ephemeral: true,
      }

      const routed = await router.applyRouting(response)

      expect(routed.ephemeral).toBe(true)
      expect(routed.targetId).toBe('user123') // ephemeral stays at source
    })
  })

  describe('applyRoutingMany()', () => {
    beforeEach(async () => {
      await config.set('generalChannelId', '123456789')
      await config.set('trackerChannelId', '987654321')
    })

    it('should route multiple responses correctly', async () => {
      const responses: Response[] = [
        {
          type: MessageType.REGISTER,
          targetId: 'user1',
          content: 'Test 1',
        },
        {
          type: MessageType.GAME_DETECTED,
          targetId: 'user2',
          content: 'Test 2',
        },
        {
          type: MessageType.SETUP_STATUS,
          targetId: 'admin1',
          content: 'Test 3',
        },
      ]

      const routed = await router.applyRoutingMany(responses)

      expect(routed).toHaveLength(3)
      expect(routed[0].targetId).toBe('123456789') // general
      expect(routed[1].targetId).toBe('987654321') // tracker
      expect(routed[2].targetId).toBe('admin1') // source
    })
  })

  describe('broadcast()', () => {
    it('should create responses for both channels', async () => {
      await config.set('generalChannelId', '123456789')
      await config.set('trackerChannelId', '987654321')

      const responses = await router.broadcast({
        type: MessageType.INFO,
        content: 'Announcement',
      })

      expect(responses).toHaveLength(2)
      expect(responses[0].targetId).toBe('123456789')
      expect(responses[1].targetId).toBe('987654321')
      expect(responses[0].content).toBe('Announcement')
      expect(responses[1].content).toBe('Announcement')
    })

    it('should only create response for configured channels', async () => {
      await config.set('generalChannelId', '123456789')
      // Don't configure tracker channel

      const responses = await router.broadcast({
        type: MessageType.INFO,
        content: 'Announcement',
      })

      expect(responses).toHaveLength(1)
      expect(responses[0].targetId).toBe('123456789')
    })

    it('should return empty array if no channels configured', async () => {
      // Don't configure any channels

      const responses = await router.broadcast({
        type: MessageType.INFO,
        content: 'Announcement',
      })

      expect(responses).toHaveLength(0)
    })
  })

  describe('routeMany()', () => {
    it('should route multiple responses', async () => {
      const responses: Response[] = [
        {
          type: MessageType.REGISTER,
          targetId: 'user1',
          content: 'Test 1',
        },
        {
          type: MessageType.GAME_DETECTED,
          targetId: 'user2',
          content: 'Test 2',
        },
      ]

      const routed = await router.routeMany(responses)

      expect(routed).toHaveLength(2)
      expect(routed[0].channel).toBe('general')
      expect(routed[1].channel).toBe('tracker')
    })
  })
})
