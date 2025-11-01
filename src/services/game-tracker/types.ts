/**
 * Game Tracker Types
 *
 * Types for the game tracking service that monitors ongoing duo games
 */

import { Message } from '../../types/message'
import { MatchData } from '../riot/types'

/**
 * State of a duo being tracked
 */
export type DuoTrackingState = 'idle' | 'in_game' | 'game_ended' | 'fetching_result'

/**
 * Tracking info for a single duo
 */
export interface DuoTracking {
  /** Duo ID being tracked */
  duoId: string

  /** Current state of tracking */
  state: DuoTrackingState

  /** PUUIDs of both players */
  noobPuuid: string
  carryPuuid: string

  /** Discord user IDs */
  noobUserId: string
  carryUserId: string

  /** Timestamp of last check (for rate limiting) */
  lastCheckedAt: number

  /** Current game ID if in game */
  currentGameId?: string

  /** Number of attempts to fetch result after game ended */
  fetchAttempts: number

  /** Max attempts before giving up (default: 18 = 3 minutes with 10s interval) */
  maxFetchAttempts: number
}

/**
 * Configuration for Game Tracker
 */
export interface GameTrackerConfig {
  /** Polling interval in milliseconds (default: 10000 = 10s) */
  pollingInterval: number

  /** Minimum time between checks for same duo in ms (default: 30000 = 30s) */
  minCheckInterval: number

  /** Max concurrent API checks (default: 5) */
  maxConcurrentChecks: number

  /** Max attempts to fetch result after game ends (default: 18) */
  maxFetchAttempts: number

  /** Region for Riot API (default: 'euw1') */
  region: 'euw1' | 'eun1' | 'na1' | 'br1' | 'jp1' | 'kr'
}

/**
 * Events emitted by Game Tracker
 */
export type GameTrackerEvent =
  | { type: 'GAME_STARTED'; duoId: string; matchId: string }
  | { type: 'GAME_ENDED'; duoId: string; matchId: string }
  | { type: 'GAME_RESULT_FOUND'; duoId: string; matchData: MatchData }
  | { type: 'GAME_RESULT_TIMEOUT'; duoId: string; matchId: string }
  | { type: 'ERROR'; duoId: string; error: Error }

/**
 * Callback for game tracker events
 */
export type GameTrackerEventHandler = (event: GameTrackerEvent, messages: Message[]) => void
