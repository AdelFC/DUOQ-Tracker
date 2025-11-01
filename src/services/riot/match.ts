/**
 * Riot Match-v5 API Service
 *
 * Endpoints:
 * - GET /lol/match/v5/matches/by-puuid/{puuid}/ids
 * - GET /lol/match/v5/matches/{matchId}
 */

import { RiotClient } from './client'
import { MatchData, RiotRegion, REGION_TO_ROUTING } from './types'

export class MatchService {
  constructor(private client: RiotClient) {}

  /**
   * Get match IDs for a player
   *
   * @param puuid - Player's PUUID
   * @param region - Region for routing
   * @param count - Number of matches to retrieve (max 100, default 20)
   * @param queue - Queue ID filter (420 for Solo/Duo, 440 for Flex)
   * @returns Array of match IDs
   */
  async getMatchIdsByPuuid(
    puuid: string,
    region: RiotRegion = 'euw1',
    count: number = 20,
    queue?: number
  ): Promise<string[]> {
    if (!puuid) {
      throw new Error('PUUID is required')
    }

    const routing = REGION_TO_ROUTING[region]
    let url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids?count=${count}`

    if (queue) {
      url += `&queue=${queue}`
    }

    return this.client.get<string[]>(url)
  }

  /**
   * Get match details by match ID
   *
   * @param matchId - Match ID (e.g., "EUW1_1234567890")
   * @param region - Region for routing
   * @returns Full match data including participants, teams, etc.
   */
  async getMatchById(matchId: string, region: RiotRegion = 'euw1'): Promise<MatchData> {
    if (!matchId) {
      throw new Error('Match ID is required')
    }

    const routing = REGION_TO_ROUTING[region]
    const url = `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}`

    return this.client.get<MatchData>(url)
  }

  /**
   * Find a common match between two players
   *
   * This method retrieves recent match history for both players and finds
   * the most recent match where they played together in the same team.
   *
   * @param puuid1 - First player's PUUID
   * @param puuid2 - Second player's PUUID
   * @param region - Region for routing
   * @param count - Number of matches to check per player (default 5)
   * @returns Match data if found, null otherwise
   */
  async findCommonMatch(
    puuid1: string,
    puuid2: string,
    region: RiotRegion = 'euw1',
    count: number = 5
  ): Promise<MatchData | null> {
    // Get recent matches for both players (Solo/Duo Ranked only: queue 420)
    const [matchIds1, matchIds2] = await Promise.all([
      this.getMatchIdsByPuuid(puuid1, region, count, 420),
      this.getMatchIdsByPuuid(puuid2, region, count, 420),
    ])

    // Find common match IDs
    const commonMatchIds = matchIds1.filter((id) => matchIds2.includes(id))

    if (commonMatchIds.length === 0) {
      return null
    }

    // Get details of the most recent common match
    const mostRecentMatchId = commonMatchIds[0]
    const matchData = await this.getMatchById(mostRecentMatchId, region)

    // Verify both players are in the same team
    const participant1 = matchData.info.participants.find((p) => p.puuid === puuid1)
    const participant2 = matchData.info.participants.find((p) => p.puuid === puuid2)

    if (!participant1 || !participant2) {
      return null // Should not happen, but safety check
    }

    // Verify same team (100 = blue, 200 = red)
    if (participant1.teamId !== participant2.teamId) {
      return null // They played in different teams (soloQ)
    }

    return matchData
  }

  /**
   * Filter matches that are too old (> 4 hours)
   *
   * @param matchData - Match data to check
   * @returns true if match is recent (< 4 hours old)
   */
  isMatchRecent(matchData: MatchData): boolean {
    const now = Date.now()
    const gameEnd = matchData.info.gameEndTimestamp
    const fourHoursMs = 4 * 60 * 60 * 1000

    return now - gameEnd < fourHoursMs
  }

  /**
   * Check if match is a remake (< 5 minutes)
   *
   * @param matchData - Match data to check
   * @returns true if match is a remake
   */
  isRemake(matchData: MatchData): boolean {
    return matchData.info.gameDuration < 300 // 5 minutes
  }
}
