/**
 * Game Tracker State Manager
 *
 * Manages in-memory tracking state for all active duos
 */

import { DuoTracking, DuoTrackingState, GameTrackerConfig } from './types'

/**
 * State Manager for Game Tracker
 *
 * Keeps tracking state in RAM to avoid DB pollution
 */
export class GameTrackerStateManager {
  private trackings: Map<string, DuoTracking> = new Map()
  private config: GameTrackerConfig

  constructor(config: GameTrackerConfig) {
    this.config = config
  }

  /**
   * Add a duo to tracking
   */
  addDuo(
    duoId: string,
    noobPuuid: string,
    carryPuuid: string,
    noobUserId: string,
    carryUserId: string
  ): void {
    if (this.trackings.has(duoId)) {
      return // Already tracking
    }

    this.trackings.set(duoId, {
      duoId,
      state: 'idle',
      noobPuuid,
      carryPuuid,
      noobUserId,
      carryUserId,
      lastCheckedAt: 0, // Force immediate check
      fetchAttempts: 0,
      maxFetchAttempts: this.config.maxFetchAttempts,
    })
  }

  /**
   * Remove a duo from tracking
   */
  removeDuo(duoId: string): void {
    this.trackings.delete(duoId)
  }

  /**
   * Get tracking info for a duo
   */
  getTracking(duoId: string): DuoTracking | undefined {
    return this.trackings.get(duoId)
  }

  /**
   * Get all tracked duos
   */
  getAllTrackings(): DuoTracking[] {
    return Array.from(this.trackings.values())
  }

  /**
   * Get duos that need to be checked (respecting rate limits)
   */
  getDuosToCheck(): DuoTracking[] {
    const now = Date.now()
    const minInterval = this.config.minCheckInterval

    return this.getAllTrackings().filter((tracking) => {
      const timeSinceLastCheck = now - tracking.lastCheckedAt
      return timeSinceLastCheck >= minInterval
    })
  }

  /**
   * Update state for a duo
   */
  updateState(duoId: string, state: DuoTrackingState): void {
    const tracking = this.trackings.get(duoId)
    if (!tracking) return

    tracking.state = state
    tracking.lastCheckedAt = Date.now()
  }

  /**
   * Mark duo as in game
   */
  setInGame(duoId: string, gameId: string): void {
    const tracking = this.trackings.get(duoId)
    if (!tracking) return

    tracking.state = 'in_game'
    tracking.currentGameId = gameId
    tracking.lastCheckedAt = Date.now()
  }

  /**
   * Mark game as ended
   */
  setGameEnded(duoId: string): void {
    const tracking = this.trackings.get(duoId)
    if (!tracking) return

    tracking.state = 'game_ended'
    tracking.fetchAttempts = 0
    tracking.lastCheckedAt = Date.now()
  }

  /**
   * Increment fetch attempts and check if max reached
   */
  incrementFetchAttempts(duoId: string): boolean {
    const tracking = this.trackings.get(duoId)
    if (!tracking) return true // Treat as max reached

    tracking.fetchAttempts++
    tracking.lastCheckedAt = Date.now()

    return tracking.fetchAttempts >= tracking.maxFetchAttempts
  }

  /**
   * Reset tracking to idle state
   */
  resetToIdle(duoId: string): void {
    const tracking = this.trackings.get(duoId)
    if (!tracking) return

    tracking.state = 'idle'
    tracking.currentGameId = undefined
    tracking.fetchAttempts = 0
    tracking.lastCheckedAt = Date.now()
  }

  /**
   * Get number of tracked duos
   */
  getTrackingCount(): number {
    return this.trackings.size
  }

  /**
   * Clear all trackings (for testing)
   */
  clear(): void {
    this.trackings.clear()
  }
}
