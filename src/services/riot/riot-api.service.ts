/**
 * Riot API Service
 *
 * Provides methods for interacting with the Riot Games API
 */

import type { ConfigService } from '../config/index.js'
import type { Config } from '../../types/state.js'

export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

export class RiotApiService {
  private readonly BASE_URL = 'https://europe.api.riotgames.com'

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

    const url = `${this.BASE_URL}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`

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
        throw new Error('Trop de requêtes API Riot. Réessayez dans quelques instants.')
      }

      if (!response.ok) {
        throw new Error(`Erreur API Riot: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

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
}
