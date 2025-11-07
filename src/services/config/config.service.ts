/**
 * Configuration Service
 * Service centralisé pour gérer la configuration du challenge
 *
 * Stockage : Map in-memory (sera remplacé par DB plus tard)
 */

import type { ChallengeConfig, ConfigKey } from './types.js'

export class ConfigService {
  private config: Map<ConfigKey, string>

  constructor() {
    this.config = new Map()
    this.initDefaults()
  }

  /**
   * Initialise les valeurs par défaut
   */
  private initDefaults(): void {
    this.config.set('eventTimezone', 'Europe/Paris')
  }

  /**
   * Récupère une valeur de configuration
   */
  async get(key: ConfigKey): Promise<string | null> {
    return this.config.get(key) || null
  }

  /**
   * Définit une valeur de configuration
   */
  async set(key: ConfigKey, value: string): Promise<void> {
    this.config.set(key, value)
  }

  /**
   * Récupère une valeur de configuration (synchrone)
   * Utile pour l'accès rapide pendant le traitement
   */
  getSync(key: ConfigKey): string | null {
    return this.config.get(key) || null
  }

  /**
   * Définit une valeur de configuration (synchrone)
   * Utile pour l'initialisation du bot
   */
  setSync(key: ConfigKey, value: string): void {
    this.config.set(key, value)
  }

  /**
   * Supprime une valeur de configuration
   */
  async delete(key: ConfigKey): Promise<void> {
    this.config.delete(key)
  }

  /**
   * Récupère toute la configuration du challenge
   */
  async getConfig(): Promise<ChallengeConfig> {
    return {
      eventStartDate: await this.get('eventStartDate'),
      eventEndDate: await this.get('eventEndDate'),
      eventTimezone: (await this.get('eventTimezone')) || 'Europe/Paris',
      generalChannelId: await this.get('generalChannelId'),
      trackerChannelId: await this.get('trackerChannelId'),
      devChannelId: await this.get('devChannelId'),
      riotApiKey: await this.get('riotApiKey'),
      riotApiKeyUpdatedAt: await this.get('riotApiKeyUpdatedAt'),
      riotApiKeyReminders: await this.get('riotApiKeyReminders'),
      lastApiKeyReminder: await this.get('lastApiKeyReminder'),
      isActive: await this.isEventActive(),
    }
  }

  /**
   * Définit les dates de l'événement
   */
  async setEventDates(startDate: string, endDate: string, timezone?: string): Promise<void> {
    await this.set('eventStartDate', startDate)
    await this.set('eventEndDate', endDate)
    if (timezone) {
      await this.set('eventTimezone', timezone)
    }
  }

  /**
   * Définit les channels Discord
   */
  async setChannels(generalChannelId: string, trackerChannelId: string): Promise<void> {
    await this.set('generalChannelId', generalChannelId)
    await this.set('trackerChannelId', trackerChannelId)
  }

  /**
   * Vérifie si l'événement est actif
   */
  async isEventActive(): Promise<boolean> {
    const startDate = await this.get('eventStartDate')
    const endDate = await this.get('eventEndDate')

    if (!startDate || !endDate) {
      return false
    }

    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    return now >= start && now <= end
  }

  /**
   * Réinitialise toute la configuration (sauf channels)
   */
  async reset(keepChannels = true): Promise<void> {
    const generalChannel = keepChannels ? await this.get('generalChannelId') : null
    const trackerChannel = keepChannels ? await this.get('trackerChannelId') : null

    this.config.clear()
    this.initDefaults()

    if (keepChannels && generalChannel && trackerChannel) {
      await this.set('generalChannelId', generalChannel)
      await this.set('trackerChannelId', trackerChannel)
    }
  }
}
