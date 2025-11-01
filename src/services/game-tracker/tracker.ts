/**
 * Game Tracker Service
 *
 * Main service that polls for ongoing duo games and emits events
 */

import { RiotService } from '../riot'
import { GameDetector } from './detector'
import { GameTrackerStateManager } from './state-manager'
import {
  GameTrackerConfig,
  GameTrackerEvent,
  GameTrackerEventHandler,
  DuoTracking,
} from './types'
import { Message } from '../../types/message'

/**
 * Default configuration
 */
const DEFAULT_CONFIG: GameTrackerConfig = {
  pollingInterval: 10000, // 10 seconds
  minCheckInterval: 30000, // 30 seconds between checks for same duo
  maxConcurrentChecks: 5, // Max 5 concurrent API calls
  maxFetchAttempts: 18, // 18 attempts = 3 minutes with 10s interval
  region: 'euw1',
}

/**
 * Game Tracker Service
 *
 * Monitors active duos and detects games automatically
 */
export class GameTracker {
  private config: GameTrackerConfig
  private stateManager: GameTrackerStateManager
  private detector: GameDetector
  private eventHandler: GameTrackerEventHandler
  private pollingTimer?: NodeJS.Timeout
  private isRunning: boolean = false

  constructor(
    riotService: RiotService,
    eventHandler: GameTrackerEventHandler,
    config?: Partial<GameTrackerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.stateManager = new GameTrackerStateManager(this.config)
    this.detector = new GameDetector(riotService)
    this.eventHandler = eventHandler
  }

  /**
   * Start tracking
   */
  start(): void {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    console.log('[GameTracker] Started')

    // Start polling loop
    this.pollingTimer = setInterval(() => {
      this.poll()
    }, this.config.pollingInterval)

    // Run first poll immediately
    this.poll()
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isRunning) {
      return
    }

    this.isRunning = false

    if (this.pollingTimer) {
      clearInterval(this.pollingTimer)
      this.pollingTimer = undefined
    }

    console.log('[GameTracker] Stopped')
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
    this.stateManager.addDuo(duoId, noobPuuid, carryPuuid, noobUserId, carryUserId)
    console.log(`[GameTracker] Added duo ${duoId} to tracking`)
  }

  /**
   * Remove a duo from tracking
   */
  removeDuo(duoId: string): void {
    this.stateManager.removeDuo(duoId)
    console.log(`[GameTracker] Removed duo ${duoId} from tracking`)
  }

  /**
   * Get tracking state for a duo
   */
  getTracking(duoId: string): DuoTracking | undefined {
    return this.stateManager.getTracking(duoId)
  }

  /**
   * Get all trackings
   */
  getAllTrackings(): DuoTracking[] {
    return this.stateManager.getAllTrackings()
  }

  /**
   * Main polling loop
   */
  private async poll(): Promise<void> {
    // Get duos that need to be checked (respecting rate limits)
    const duosToCheck = this.stateManager.getDuosToCheck()

    if (duosToCheck.length === 0) {
      return
    }

    // Limit concurrent checks
    const duosToProcess = duosToCheck.slice(0, this.config.maxConcurrentChecks)

    // Process each duo
    await Promise.all(duosToProcess.map((tracking) => this.processDuo(tracking)))
  }

  /**
   * Process a single duo
   */
  private async processDuo(tracking: DuoTracking): Promise<void> {
    try {
      switch (tracking.state) {
        case 'idle':
          await this.checkForGameStart(tracking)
          break

        case 'in_game':
          await this.checkForGameEnd(tracking)
          break

        case 'game_ended':
        case 'fetching_result':
          await this.fetchGameResult(tracking)
          break
      }
    } catch (error) {
      console.error(`[GameTracker] Error processing duo ${tracking.duoId}:`, error)
      this.emit({
        type: 'ERROR',
        duoId: tracking.duoId,
        error: error as Error,
      })
    }
  }

  /**
   * Check if duo started a game
   */
  private async checkForGameStart(tracking: DuoTracking): Promise<void> {
    const matchId = await this.detector.isInGame(tracking)

    if (matchId) {
      // Game started!
      this.stateManager.setInGame(tracking.duoId, matchId)
      console.log(`[GameTracker] Duo ${tracking.duoId} started game ${matchId}`)

      this.emit({
        type: 'GAME_STARTED',
        duoId: tracking.duoId,
        matchId,
      })
    } else {
      // Still idle
      this.stateManager.updateState(tracking.duoId, 'idle')
    }
  }

  /**
   * Check if game ended
   */
  private async checkForGameEnd(tracking: DuoTracking): Promise<void> {
    if (!tracking.currentGameId) {
      // No game ID, reset to idle
      this.stateManager.resetToIdle(tracking.duoId)
      return
    }

    const hasEnded = await this.detector.hasMatchEnded(tracking.currentGameId)

    if (hasEnded) {
      // Game ended!
      this.stateManager.setGameEnded(tracking.duoId)
      console.log(`[GameTracker] Duo ${tracking.duoId} game ${tracking.currentGameId} ended`)

      this.emit({
        type: 'GAME_ENDED',
        duoId: tracking.duoId,
        matchId: tracking.currentGameId,
      })
    } else {
      // Still in game
      this.stateManager.updateState(tracking.duoId, 'in_game')
    }
  }

  /**
   * Fetch game result after it ended
   */
  private async fetchGameResult(tracking: DuoTracking): Promise<void> {
    const matchData = await this.detector.findCompletedMatch(tracking)

    if (matchData) {
      // Result found!
      this.stateManager.resetToIdle(tracking.duoId)
      console.log(
        `[GameTracker] Duo ${tracking.duoId} result found: ${matchData.metadata.matchId}`
      )

      this.emit({
        type: 'GAME_RESULT_FOUND',
        duoId: tracking.duoId,
        matchData,
      })
    } else {
      // Result not found yet, increment attempts
      const maxReached = this.stateManager.incrementFetchAttempts(tracking.duoId)

      if (maxReached) {
        // Max attempts reached, give up
        this.stateManager.resetToIdle(tracking.duoId)
        console.warn(
          `[GameTracker] Duo ${tracking.duoId} result timeout after ${tracking.fetchAttempts} attempts`
        )

        this.emit({
          type: 'GAME_RESULT_TIMEOUT',
          duoId: tracking.duoId,
          matchId: tracking.currentGameId || 'unknown',
        })
      } else {
        // Keep trying
        this.stateManager.updateState(tracking.duoId, 'fetching_result')
      }
    }
  }

  /**
   * Emit an event
   */
  private emit(event: GameTrackerEvent): void {
    const messages: Message[] = []
    this.eventHandler(event, messages)
  }
}
