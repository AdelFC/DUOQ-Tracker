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
  riotApiKeyUpdatedAt: string | null // ISO timestamp - when key was last updated
  riotApiKeyReminders: string | null // JSON array of reminder timestamps
  lastApiKeyReminder: string | null // ISO timestamp (deprecated - use riotApiKeyReminders)

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
  | 'riotApiKeyUpdatedAt'
  | 'riotApiKeyReminders'
  | 'lastApiKeyReminder'

export interface ConfigEntry {
  key: ConfigKey
  value: string
  updatedAt: Date
}
