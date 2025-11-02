/**
 * Tests for DailyLadderService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DailyLadderService } from '../../services/daily-ladder.js'
import { state, player, duo } from '../fixtures/builders.js'
import type { ConfigService } from '../../services/config/index.js'
import type { Client, TextChannel } from 'discord.js'
import type { State } from '../../types/state.js'

// Mock discord.js Client
const mockClient = {
  channels: {
    fetch: vi.fn(),
  },
} as unknown as Client

// Mock TextChannel
const mockChannel = {
  isTextBased: () => true,
  send: vi.fn(),
} as unknown as TextChannel

describe('DailyLadderService', () => {
  let service: DailyLadderService
  let testState: State

  beforeEach(() => {
    testState = state().build()
    service = new DailyLadderService(mockClient, testState)
    vi.clearAllMocks()
  })

  afterEach(() => {
    service.stop()
  })

  describe('start/stop', () => {
    it('should start the service', () => {
      service.start()
      expect(service.isRunning()).toBe(true)
    })

    it('should stop the service', () => {
      service.start()
      service.stop()
      expect(service.isRunning()).toBe(false)
    })

    it('should stop existing job when starting again', () => {
      service.start()
      const firstRun = service.getNextRun()
      service.start()
      const secondRun = service.getNextRun()
      // Should still be running
      expect(service.isRunning()).toBe(true)
    })
  })

  describe('postDailyLadder', () => {
    beforeEach(async () => {
      const config = testState.config as ConfigService
      await config.set('trackerChannelId', 'tracker-123')
      await config.set('eventStartDate', new Date(Date.now() - 86400000).toISOString()) // Yesterday
      await config.set('eventEndDate', new Date(Date.now() + 86400000).toISOString()) // Tomorrow

      vi.mocked(mockClient.channels.fetch).mockResolvedValue(mockChannel)
      vi.mocked(mockChannel.send).mockResolvedValue({} as any)
    })

    it('should not post if tracker channel is not configured', async () => {
      const config = testState.config as ConfigService
      await config.set('trackerChannelId', null)

      await service.postDailyLadder()

      expect(mockClient.channels.fetch).not.toHaveBeenCalled()
    })

    it('should not post if event is not active', async () => {
      const config = testState.config as ConfigService
      // Set event in the future
      await config.set('eventStartDate', new Date(Date.now() + 86400000).toISOString())
      await config.set('eventEndDate', new Date(Date.now() + 172800000).toISOString())

      await service.postDailyLadder()

      expect(mockClient.channels.fetch).not.toHaveBeenCalled()
    })

    it('should not post if no duos exist', async () => {
      // Empty state (no duos)
      await service.postDailyLadder()

      // Should NOT fetch channel (early return before fetching)
      expect(mockClient.channels.fetch).not.toHaveBeenCalled()
      expect(mockChannel.send).not.toHaveBeenCalled()
    })

    it('should post ladder with all duos', async () => {
      // Create test duos
      const player1 = player('user1').withGameName('Player1', 'EUW').asNoob().withPoints(500).build()
      const player2 = player('user2').withGameName('Player2', 'EUW').asCarry().withPoints(300).build()
      const player3 = player('user3').withGameName('Player3', 'EUW').asNoob().withPoints(200).build()
      const player4 = player('user4').withGameName('Player4', 'EUW').asCarry().withPoints(100).build()

      testState.players.set(player1.discordId, player1)
      testState.players.set(player2.discordId, player2)
      testState.players.set(player3.discordId, player3)
      testState.players.set(player4.discordId, player4)

      const duo1 = duo('user1', 'user2').withId(1).withName('Dream Team').withGames(15, 10, 5).build()
      const duo2 = duo('user3', 'user4').withId(2).withName('Noob Squad').withGames(15, 5, 10).build()

      testState.duos.set(duo1.id, duo1)
      testState.duos.set(duo2.id, duo2)

      await service.postDailyLadder()

      expect(mockClient.channels.fetch).toHaveBeenCalledWith('tracker-123')
      expect(mockChannel.send).toHaveBeenCalledTimes(1)

      // Verify embed structure
      const sentEmbed = vi.mocked(mockChannel.send).mock.calls[0][0]
      expect(sentEmbed).toHaveProperty('embeds')
      expect(sentEmbed.embeds).toHaveLength(1)

      const embed = sentEmbed.embeds[0]
      expect(embed.title).toContain('Classement Quotidien')
      expect(embed.description).toContain('Dream Team')
      expect(embed.description).toContain('Noob Squad')
      expect(embed.description).toContain('800') // Total points for Dream Team
      expect(embed.description).toContain('300') // Total points for Noob Squad
    })

    it('should sort duos by total points descending', async () => {
      // Create duos with different point totals
      const player1 = player('user1').withGameName('Low', 'EUW').asNoob().withPoints(100).build()
      const player2 = player('user2').withGameName('Low2', 'EUW').asCarry().withPoints(50).build()
      const player3 = player('user3').withGameName('High', 'EUW').asNoob().withPoints(500).build()
      const player4 = player('user4').withGameName('High2', 'EUW').asCarry().withPoints(400).build()

      testState.players.set(player1.discordId, player1)
      testState.players.set(player2.discordId, player2)
      testState.players.set(player3.discordId, player3)
      testState.players.set(player4.discordId, player4)

      const duo1 = duo('user1', 'user2').withId(1).withName('Low Team').build()
      const duo2 = duo('user3', 'user4').withId(2).withName('High Team').build()

      testState.duos.set(duo1.id, duo1)
      testState.duos.set(duo2.id, duo2)

      await service.postDailyLadder()

      const sentEmbed = vi.mocked(mockChannel.send).mock.calls[0][0]
      const embed = sentEmbed.embeds[0]

      // High Team should be first (rank 1)
      expect(embed.description).toMatch(/🥇.*High Team/s)
      // Low Team should be second (rank 2)
      expect(embed.description).toMatch(/🥈.*Low Team/s)
    })

    it('should handle channel not found', async () => {
      vi.mocked(mockClient.channels.fetch).mockResolvedValue(null)

      await service.postDailyLadder()

      expect(mockChannel.send).not.toHaveBeenCalled()
    })

    it('should handle non-text channel', async () => {
      const nonTextChannel = {
        isTextBased: () => false,
      } as unknown as TextChannel

      vi.mocked(mockClient.channels.fetch).mockResolvedValue(nonTextChannel)

      await service.postDailyLadder()

      expect(mockChannel.send).not.toHaveBeenCalled()
    })

    it('should use custom name if available', async () => {
      const player1 = player('user1').withGameName('Noob1', 'EUW').asNoob().withPoints(100).build()
      const player2 = player('user2').withGameName('Carry1', 'EUW').asCarry().withPoints(100).build()
      const player3 = player('user3').withGameName('Noob2', 'EUW').asNoob().withPoints(90).build()
      const player4 = player('user4').withGameName('Carry2', 'EUW').asCarry().withPoints(90).build()

      testState.players.set(player1.discordId, player1)
      testState.players.set(player2.discordId, player2)
      testState.players.set(player3.discordId, player3)
      testState.players.set(player4.discordId, player4)

      const duo1 = duo('user1', 'user2').withId(1).withName('Custom Name').build()
      const duo2 = duo('user3', 'user4').withId(2).build() // Gets default name "Duo 2"

      testState.duos.set(duo1.id, duo1)
      testState.duos.set(duo2.id, duo2)

      await service.postDailyLadder()

      const sentEmbed = vi.mocked(mockChannel.send).mock.calls[0][0]
      const embed = sentEmbed.embeds[0]

      // Should show custom team name for duo1
      expect(embed.description).toContain('Custom Name')
      // Should show default name for duo2
      expect(embed.description).toContain('Duo 2')
    })
  })

  describe('getNextRun', () => {
    it('should return null if not running', () => {
      expect(service.getNextRun()).toBeNull()
    })

    it('should return next scheduled time if running', () => {
      service.start()
      const nextRun = service.getNextRun()
      expect(nextRun).toBeInstanceOf(Date)
      expect(nextRun!.getHours()).toBe(19)
    })
  })
})
