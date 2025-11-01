/**
 * Game Detector
 *
 * Detects ongoing and completed duo games
 */

import { RiotService } from '../riot'
import { MatchData } from '../riot/types'
import { DuoTracking } from './types'

/**
 * Game Detector
 *
 * Checks if two players are in a game together
 */
export class GameDetector {
  constructor(private riotService: RiotService) {}

  /**
   * Check if duo is currently in a game together
   *
   * Returns match ID if in game, null otherwise
   */
  async isInGame(tracking: DuoTracking): Promise<string | null> {
    try {
      // Get recent match for both players (count=1, ranked solo/duo only)
      const [matchIds1, matchIds2] = await Promise.all([
        this.riotService.getMatchIds(tracking.noobPuuid, 'euw1', 1, 420),
        this.riotService.getMatchIds(tracking.carryPuuid, 'euw1', 1, 420),
      ])

      // No recent matches
      if (matchIds1.length === 0 || matchIds2.length === 0) {
        return null
      }

      // Check if most recent match is the same
      const latestMatch1 = matchIds1[0]
      const latestMatch2 = matchIds2[0]

      if (latestMatch1 !== latestMatch2) {
        return null // Not in same game
      }

      // Get match details to verify it's ongoing
      const matchData = await this.riotService.getMatch(latestMatch1, 'euw1')

      // If match ended recently (< 4 hours), it's not an ongoing game
      if (this.riotService.isMatchRecent(matchData)) {
        // Match exists but already ended
        return null
      }

      // Match found and not ended yet
      return latestMatch1
    } catch (error) {
      console.error(`[GameDetector] Error checking if duo ${tracking.duoId} is in game:`, error)
      return null
    }
  }

  /**
   * Find completed match for a duo
   *
   * Returns match data if found, null otherwise
   */
  async findCompletedMatch(tracking: DuoTracking): Promise<MatchData | null> {
    try {
      // Use RiotService's findCommonMatch which:
      // 1. Gets recent matches for both players
      // 2. Finds common match IDs
      // 3. Verifies they're in the same team
      const matchData = await this.riotService.findCommonMatch(
        tracking.noobPuuid,
        tracking.carryPuuid,
        'euw1',
        5 // Check last 5 games
      )

      if (!matchData) {
        return null
      }

      // Verify match is recent (< 4 hours)
      if (!this.riotService.isMatchRecent(matchData)) {
        return null // Too old
      }

      // Verify it's not a remake (< 5 minutes)
      if (this.riotService.isRemake(matchData)) {
        return null // Remake, don't count
      }

      return matchData
    } catch (error) {
      console.error(
        `[GameDetector] Error finding completed match for duo ${tracking.duoId}:`,
        error
      )
      return null
    }
  }

  /**
   * Check if a specific match has ended
   *
   * Returns true if match ended, false if still ongoing
   */
  async hasMatchEnded(matchId: string): Promise<boolean> {
    try {
      const matchData = await this.riotService.getMatch(matchId, 'euw1')

      // If we can get match details and it's recent, it has ended
      return this.riotService.isMatchRecent(matchData)
    } catch (error) {
      // If we can't fetch the match, assume it hasn't ended yet
      // (or there was an API error)
      return false
    }
  }
}
