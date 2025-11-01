/**
 * State global de l'application
 * Inspiré de /TOMOVE/V2/src/types/state.ts
 */

import type { Player } from './player.js'
import type { Duo } from './duo.js'
import type { Game } from './game.js'
import type { ConfigService } from '../services/config/index.js'

export interface Clock {
  now(): Date
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date()
  }
}

export interface Config {
  // Discord
  discordToken: string
  guildId: string
  adminRoleId: string
  devChannelId?: string // Channel pour les messages /dev

  // Riot API
  riotApiKey: string
  riotApiKeyUpdatedAt?: Date // Quand la clé a été changée
  riotApiKeyReminders?: Date[] // Timestamps des rappels envoyés
  region: string // 'EUW1', 'NA1', etc.

  // Challenge
  challengeStartDate: Date
  challengeEndDate: Date

  // Tracking
  gameCheckInterval: number // ms entre chaque check de game
  maxGamesPerCheck: number
}

export interface Dev {
  userId: string // Discord user ID
  username: string // Discord username
  registeredAt: Date
}

export interface State {
  // Data
  players: Map<string, Player> // key: discordId
  duos: Map<number, Duo> // key: duo.id
  games: Map<string, Game> // key: matchId
  devs: Map<string, Dev> // key: userId - Devs authentifiés pour recevoir les rappels

  // Config (legacy - will be removed later)
  config: Config | ConfigService

  // Dependencies (injectable pour tests)
  clock?: Clock
  riotService?: any
  database?: any
}
