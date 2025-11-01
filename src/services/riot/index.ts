/**
 * Riot API Service - Unified API
 *
 * Provides a single entry point for all Riot API operations.
 *
 * Usage:
 * ```ts
 * const riot = new RiotService({ apiKey: 'RGAPI-...' })
 *
 * // Get account
 * const account = await riot.getAccountByRiotId('Faker', 'KR1')
 *
 * // Get match history
 * const matchIds = await riot.getMatchIds(account.puuid)
 *
 * // Find common match between duo
 * const match = await riot.findCommonMatch(puuid1, puuid2)
 * ```
 */

import { RiotClient, RiotClientConfig } from './client'
import { AccountService } from './account'
import { MatchService } from './match'
import { RiotAccount, MatchData, RiotRegion } from './types'

export class RiotService {
  private client: RiotClient
  private accountService: AccountService
  private matchService: MatchService

  constructor(config: RiotClientConfig) {
    this.client = new RiotClient(config)
    this.accountService = new AccountService(this.client)
    this.matchService = new MatchService(this.client)
  }

  // ============================================================================
  // ACCOUNT API
  // ============================================================================

  /**
   * Get account by Riot ID (gameName + tagLine)
   */
  async getAccountByRiotId(
    gameName: string,
    tagLine: string,
    region: RiotRegion = 'euw1'
  ): Promise<RiotAccount> {
    return this.accountService.getAccountByRiotId(gameName, tagLine, region)
  }

  // ============================================================================
  // MATCH API
  // ============================================================================

  /**
   * Get match IDs for a player
   */
  async getMatchIds(
    puuid: string,
    region: RiotRegion = 'euw1',
    count: number = 20,
    queue?: number
  ): Promise<string[]> {
    return this.matchService.getMatchIdsByPuuid(puuid, region, count, queue)
  }

  /**
   * Get match details by match ID
   */
  async getMatch(matchId: string, region: RiotRegion = 'euw1'): Promise<MatchData> {
    return this.matchService.getMatchById(matchId, region)
  }

  /**
   * Find a common match between two players (same team)
   */
  async findCommonMatch(
    puuid1: string,
    puuid2: string,
    region: RiotRegion = 'euw1',
    count: number = 5
  ): Promise<MatchData | null> {
    return this.matchService.findCommonMatch(puuid1, puuid2, region, count)
  }

  /**
   * Check if match is recent (< 4 hours)
   */
  isMatchRecent(matchData: MatchData): boolean {
    return this.matchService.isMatchRecent(matchData)
  }

  /**
   * Check if match is a remake (< 5 minutes)
   */
  isRemake(matchData: MatchData): boolean {
    return this.matchService.isRemake(matchData)
  }
}

// Re-export types for convenience
export * from './types'
export { RiotClient, RiotApiError, RateLimitError } from './client'
