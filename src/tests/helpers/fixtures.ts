/**
 * Test Fixtures - Helper functions for creating test data
 *
 * These helpers provide complete, valid objects for testing,
 * with sensible defaults that can be overridden as needed.
 */

import type { Player, Streaks } from '../../types/player.js'
import type { Duo } from '../../types/duo.js'
import type { Config } from '../../types/state.js'

/**
 * Create a test Player with all required fields
 *
 * @param overrides - Partial Player to override defaults
 * @returns Complete Player object
 */
export function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    // Identity
    discordId: 'test-player',
    puuid: 'test-puuid-123',
    gameName: 'TestPlayer',
    tagLine: 'EUW',

    // Challenge info
    role: 'noob',
    duoId: 0,

    // Rank info
    peakElo: 'G3',
    initialRank: { tier: 'GOLD', division: 'III', lp: 50 },
    currentRank: { tier: 'GOLD', division: 'III', lp: 50 },

    // Main info
    mainRoleString: 'ADC',
    mainChampion: 'Jinx',
    detectedMainRole: null,

    // Stats
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    streaks: {
      current: 0,
      longestWin: 0,
      longestLoss: 0,
    },

    // Timestamps
    registeredAt: new Date(),
    lastGameAt: null,

    // Apply overrides
    ...overrides,
  }
}

/**
 * Create a test Duo with all required fields
 *
 * @param overrides - Partial Duo to override defaults
 * @returns Complete Duo object
 */
export function createTestDuo(overrides: Partial<Duo> = {}): Duo {
  return {
    id: 1,
    name: 'Test Duo',

    // Players
    noobId: 'player1',
    carryId: 'player2',

    // Stats
    totalPoints: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,

    // Streaks
    currentStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,

    // Timestamps
    createdAt: new Date(),
    lastGameAt: null,

    // Apply overrides
    ...overrides,
  }
}

/**
 * Create a test Config with all required fields
 *
 * @param overrides - Partial Config to override defaults
 * @returns Complete Config object
 */
export function createTestConfig(overrides: Partial<Config> = {}): Config {
  return {
    discordToken: 'test-token',
    guildId: 'test-guild',
    adminRoleId: 'test-admin-role',
    devChannelId: 'test-dev-channel',
    riotApiKey: 'RGAPI-test-key',
    riotApiKeyUpdatedAt: undefined,
    riotApiKeyReminders: [],
    region: 'EUW1',
    challengeStartDate: new Date('2024-01-01'),
    challengeEndDate: new Date('2024-12-31'),
    gameCheckInterval: 60000,
    maxGamesPerCheck: 10,

    // Apply overrides
    ...overrides,
  }
}

/**
 * Create a test Streaks object
 *
 * @param current - Current streak (positive = win, negative = loss)
 * @param longestWin - Longest win streak
 * @param longestLoss - Longest loss streak
 * @returns Streaks object
 */
export function createTestStreaks(
  current: number = 0,
  longestWin: number = 0,
  longestLoss: number = 0
): Streaks {
  return {
    current,
    longestWin,
    longestLoss,
  }
}
