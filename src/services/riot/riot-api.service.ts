/**
 * Riot API Service
 *
 * Provides methods for interacting with the Riot Games API
 */

import type { ConfigService } from '../config/index.js'
import type { Config } from '../../types/state.js'
import { logWarn, logError } from '../../utils/discord-logger.js'

export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

export interface MatchParticipant {
  puuid: string
  summonerId: string
  championId: number
  championName: string
  teamPosition: string
  kills: number
  deaths: number
  assists: number
  win: boolean
  teamId: number
}

export interface MatchInfo {
  matchId: string
  gameId: number
  gameCreation: number
  gameStartTimestamp: number
  gameEndTimestamp: number
  gameDuration: number
  gameMode: string
  queueId: number
  gameEndedInEarlySurrender: boolean // true = remake
  gameEndedInSurrender: boolean // true = normal surrender
  participants: MatchParticipant[]
}

export class RiotApiService {
  private readonly ACCOUNT_BASE_URL = 'https://europe.api.riotgames.com'
  private readonly MATCH_BASE_URL = 'https://europe.api.riotgames.com'

  constructor(private config: Config | ConfigService) {}

  /**
   * Get account by Riot ID (gameName#tagLine)
   * @returns Account data with PUUID
   * @throws Error if account not found or API error
   */
  async getAccountByRiotId(gameName: string, tagLine: string): Promise<RiotAccount> {
    // Handle both Config object and ConfigService
    const apiKey =
      typeof this.config === 'object' && 'getSync' in this.config
        ? this.config.getSync('riotApiKey')
        : (this.config as any).riotApiKey

    if (!apiKey) {
      throw new Error('Clé API Riot non configurée. Utilisez /key set pour la définir.')
    }

    const url = `${this.ACCOUNT_BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      })

      if (response.status === 404) {
        throw new Error(`Le compte Riot ${gameName}#${tagLine} n'existe pas.`)
      }

      if (response.status === 403) {
        throw new Error('Clé API Riot invalide ou expirée. Utilisez /key set pour la mettre à jour.')
      }

      if (response.status === 429) {
        await logWarn(
          '🚨 RATE LIMIT RIOT API',
          'Trop de requêtes API. Considère augmenter pollInterval dans bot/index.ts'
        )
        throw new Error('Trop de requêtes API Riot. Réessayez dans quelques instants.')
      }

      if (!response.ok) {
        throw new Error(`Erreur API Riot: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as RiotAccount

      return {
        puuid: data.puuid,
        gameName: data.gameName,
        tagLine: data.tagLine,
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Erreur lors de la vérification du compte Riot')
    }
  }

  /**
   * Validate that a Riot ID exists
   * @returns true if account exists, false otherwise
   */
  async validateRiotId(gameName: string, tagLine: string): Promise<boolean> {
    try {
      await this.getAccountByRiotId(gameName, tagLine)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get recent match IDs for a player
   * @param puuid - Player PUUID
   * @param count - Number of matches to retrieve (default: 5, max: 100)
   * @param queue - Optional queue ID to filter (e.g., 420 for ranked solo/duo)
   * @returns Array of match IDs
   */
  async getRecentMatchIds(puuid: string, count: number = 5, queue?: number): Promise<string[]> {
    const apiKey = this.getApiKey()
    let url = `${this.MATCH_BASE_URL}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`
    if (queue) {
      url += `&queue=${queue}`
    }

    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur API Riot: ${response.status}`)
      }

      return await response.json() as string[]
    } catch (error) {
      console.error(`[RiotAPI] Error fetching match IDs for ${puuid}:`, error)
      return []
    }
  }

  /**
   * Get detailed match information
   * @param matchId - Match ID (format: EUW1_1234567890)
   * @returns Match details
   */
  async getMatchDetails(matchId: string): Promise<MatchInfo | null> {
    const apiKey = this.getApiKey()
    const url = `${this.MATCH_BASE_URL}/lol/match/v5/matches/${matchId}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Erreur API Riot: ${response.status}`)
      }

      const data = await response.json() as any

      // Extract relevant info
      const participants: MatchParticipant[] = data.info.participants.map((p: any) => ({
        puuid: p.puuid,
        summonerId: p.summonerId,
        championId: p.championId,
        championName: p.championName,
        teamPosition: p.teamPosition || 'UNKNOWN',
        kills: p.kills,
        deaths: p.deaths,
        assists: p.assists,
        win: p.win,
        teamId: p.teamId,
      }))

      return {
        matchId: data.metadata.matchId,
        gameId: data.info.gameId,
        gameCreation: data.info.gameCreation,
        gameStartTimestamp: data.info.gameStartTimestamp,
        gameEndTimestamp: data.info.gameEndTimestamp,
        gameDuration: data.info.gameDuration,
        gameMode: data.info.gameMode,
        queueId: data.info.queueId,
        gameEndedInEarlySurrender: data.info.gameEndedInEarlySurrender || false, // true = remake
        gameEndedInSurrender: data.info.gameEndedInSurrender || false, // true = normal surrender
        participants,
      }
    } catch (error) {
      console.error(`[RiotAPI] Error fetching match details for ${matchId}:`, error)
      return null
    }
  }

  /**
   * Get rank info for a summoner by their summonerId
   * @param summonerId - The summoner ID (encrypted summoner ID from match data)
   * @returns RankInfo object or null if unranked/error
   */
  async getRankBySummonerId(summonerId: string): Promise<import('../../types/player.js').RankInfo | null> {
    const apiKey = this.getApiKey()
    // Get region from config (e.g., 'EUW1' → 'euw1')
    const region = ((this.config as any).region || 'EUW1').toLowerCase()
    const url = `https://${region}.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`

    try {
      const response = await fetch(url, {
        headers: {
          'X-Riot-Token': apiKey,
        },
      })

      if (response.status === 404) {
        // Summoner not found or unranked
        console.log(`[RiotAPI] Summoner ${summonerId} not found or unranked`)
        return null
      }

      if (response.status === 429) {
        // Rate limit - return null and log warning
        await logWarn(
          '🚨 RATE LIMIT RIOT API (getRankBySummonerId)',
          'Trop de requêtes API. Considère augmenter pollInterval dans bot/index.ts'
        )
        return null
      }

      if (!response.ok) {
        throw new Error(`Riot API error: ${response.status}`)
      }

      const data = await response.json() as any[]

      // Find RANKED_SOLO_5x5 queue
      const rankedSolo = data.find((entry: any) => entry.queueType === 'RANKED_SOLO_5x5')

      if (!rankedSolo) {
        console.log(`[RiotAPI] Summoner ${summonerId} not ranked in Solo/Duo`)
        return null
      }

      // Convert tier and rank to RankInfo format
      return {
        tier: rankedSolo.tier, // IRON, BRONZE, SILVER, GOLD, PLATINUM, EMERALD, DIAMOND, MASTER, GRANDMASTER, CHALLENGER
        division: rankedSolo.rank, // I, II, III, IV (not present for MASTER+)
        lp: rankedSolo.leaguePoints,
      }
    } catch (error) {
      console.error(`[RiotAPI] Error fetching rank for summoner ${summonerId}:`, error)
      return null
    }
  }

  /**
   * Helper to get API key from config
   */
  private getApiKey(): string {
    const apiKey =
      typeof this.config === 'object' && 'getSync' in this.config
        ? this.config.getSync('riotApiKey')
        : (this.config as any).riotApiKey

    if (!apiKey) {
      throw new Error('Clé API Riot non configurée')
    }

    return apiKey
  }
}
