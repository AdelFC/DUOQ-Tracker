/**
 * Configuration Service Types
 * Gestion centralisée de la configuration du challenge
 */

export interface ChallengeConfig {
  // Event dates
  eventStartDate: string | null // ISO timestamp
  eventEndDate: string | null // ISO timestamp
  eventTimezone: string // Default: "Europe/Paris"

  // Discord channels
  generalChannelId: string | null
  trackerChannelId: string | null

  // Riot API
  riotApiKey: string | null
  lastApiKeyReminder: string | null // ISO timestamp

  // Challenge status
  isActive: boolean
}

export type ConfigKey =
  | 'eventStartDate'
  | 'eventEndDate'
  | 'eventTimezone'
  | 'generalChannelId'
  | 'trackerChannelId'
  | 'riotApiKey'
  | 'lastApiKeyReminder'

export interface ConfigEntry {
  key: ConfigKey
  value: string
  updatedAt: Date
}
