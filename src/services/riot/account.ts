/**
 * Riot Account-v1 API Service
 *
 * Endpoints:
 * - GET /riot/account/v1/accounts/by-riot-id/{gameName}/{tagLine}
 */

import { RiotClient } from './client'
import { RiotAccount, RiotRegion, REGION_TO_ROUTING, RiotRouting } from './types'

export class AccountService {
  constructor(private client: RiotClient) {}

  /**
   * Get account by Riot ID (gameName + tagLine)
   *
   * @param gameName - Player's game name (e.g., "Faker")
   * @param tagLine - Player's tag line (e.g., "KR1")
   * @param region - Region for routing (default: euw1)
   * @returns RiotAccount with PUUID
   *
   * @throws RiotApiError if account not found (404)
   */
  async getAccountByRiotId(
    gameName: string,
    tagLine: string,
    region: RiotRegion = 'euw1'
  ): Promise<RiotAccount> {
    if (!gameName || !tagLine) {
      throw new Error('gameName and tagLine are required')
    }

    const routing = REGION_TO_ROUTING[region]
    const url = `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`

    return this.client.get<RiotAccount>(url)
  }
}
