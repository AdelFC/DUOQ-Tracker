/**
 * Tests for GameTracker
 *
 * Tests main tracker orchestration, polling, and event emission
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { GameTracker } from '../../../services/game-tracker/tracker'
import { RiotService } from '../../../services/riot'
import { GameTrackerEvent } from '../../../services/game-tracker/types'
import { Message } from '../../../types/message'
import { createMockMatch } from '../../services/riot/fixtures/match.fixture'

describe('GameTracker', () => {
  let tracker: GameTracker
  let mockRiotService: RiotService
  let events: GameTrackerEvent[]
  let messages: Message[]

  const eventHandler = (event: GameTrackerEvent, msgs: Message[]) => {
    events.push(event)
    messages.push(...msgs)
  }

  beforeEach(() => {
    events = []
    messages = []

    mockRiotService = {
      getMatchIds: vi.fn(),
      getMatch: vi.fn(),
      findCommonMatch: vi.fn(),
      isMatchRecent: vi.fn(),
      isRemake: vi.fn(),
    } as any

    tracker = new GameTracker(mockRiotService, eventHandler, {
      pollingInterval: 100, // Fast polling for tests (100ms)
      minCheckInterval: 0, // No rate limit for tests
      maxConcurrentChecks: 5,
      maxFetchAttempts: 3, // Small number for tests
      region: 'euw1',
    })
  })

  afterEach(() => {
    tracker.stop()
  })

  // ============================================================================
  // Basic functionality
  // ============================================================================

  it('devrait démarrer et arrêter le tracking', () => {
    expect(() => tracker.start()).not.toThrow()
    expect(() => tracker.stop()).not.toThrow()
  })

  it('ne devrait rien faire si start() appelé deux fois', () => {
    tracker.start()
    tracker.start() // Should not crash
    tracker.stop()
  })

  it('devrait ajouter un duo au tracking', () => {
    tracker.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')

    const tracking = tracker.getTracking('duo-1')
    expect(tracking).toBeDefined()
    expect(tracking!.duoId).toBe('duo-1')
  })

  it('devrait retirer un duo du tracking', () => {
    tracker.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')
    expect(tracker.getTracking('duo-1')).toBeDefined()

    tracker.removeDuo('duo-1')
    expect(tracker.getTracking('duo-1')).toBeUndefined()
  })

  it('devrait récupérer tous les trackings', () => {
    tracker.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')
    tracker.addDuo('duo-2', 'puuid-3', 'puuid-4', 'user-3', 'user-4')

    const trackings = tracker.getAllTrackings()
    expect(trackings).toHaveLength(2)
  })

  // ============================================================================
  // Game detection
  // ============================================================================

  it('devrait émettre GAME_RESULT_FOUND quand le résultat est trouvé', async () => {
    tracker.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')

    // Manually set to game_ended state
    const tracking = tracker.getTracking('duo-1')!
    tracking.state = 'game_ended'
    tracking.currentGameId = 'EUW1_123'

    const mockMatchData = createMockMatch()

    // Mock: result found
    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(mockMatchData)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(true)
    vi.mocked(mockRiotService.isRemake).mockReturnValue(false)

    tracker.start()

    // Wait for polling
    await new Promise((resolve) => setTimeout(resolve, 150))

    tracker.stop()

    // Should have emitted GAME_RESULT_FOUND
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GAME_RESULT_FOUND')
    expect(events[0].duoId).toBe('duo-1')
    expect((events[0] as any).matchData).toBe(mockMatchData)

    // Tracking state should be reset to 'idle'
    expect(tracking.state).toBe('idle')
  })

  it('devrait émettre GAME_RESULT_TIMEOUT après maxFetchAttempts', async () => {
    tracker.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')

    // Manually set to game_ended state
    const tracking = tracker.getTracking('duo-1')!
    tracking.state = 'game_ended'
    tracking.currentGameId = 'EUW1_123'
    tracking.fetchAttempts = 2 // Already tried 2 times

    // Mock: result not found
    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(null)

    tracker.start()

    // Wait for polling (will increment to 3, reaching max)
    await new Promise((resolve) => setTimeout(resolve, 150))

    tracker.stop()

    // Should have emitted GAME_RESULT_TIMEOUT
    expect(events).toHaveLength(1)
    expect(events[0].type).toBe('GAME_RESULT_TIMEOUT')
    expect(events[0].duoId).toBe('duo-1')

    // Tracking state should be reset to 'idle'
    expect(tracking.state).toBe('idle')
  })

  // ============================================================================
  // Rate limiting
  // ============================================================================

  it('ne devrait pas re-check un duo trop récemment vérifié', async () => {
    const now = Date.now()

    tracker = new GameTracker(mockRiotService, eventHandler, {
      pollingInterval: 100,
      minCheckInterval: 10000, // 10s minimum
      maxConcurrentChecks: 5,
      maxFetchAttempts: 3,
      region: 'euw1',
    })

    tracker.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')

    const tracking = tracker.getTracking('duo-1')!
    tracking.lastCheckedAt = now - 5000 // Checked 5s ago

    tracker.start()
    await new Promise((resolve) => setTimeout(resolve, 150))
    tracker.stop()

    // Should NOT have called API (too recent)
    expect(mockRiotService.getMatchIds).not.toHaveBeenCalled()
  })
})
