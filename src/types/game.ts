/**
 * Types pour les games trackées
 */

import type { Lane, RankInfo } from './player.js'

export type GameStatus = 'COMPLETED' | 'SCORED'

/**
 * TrackedGame - Structure stockée dans state.games Map
 * Utilisée par poll.handler pour tracker les games détectées
 * Enrichie après scoring avec les champs détaillés
 */
export interface TrackedGame {
  // Identifiers
  id: string // matchId
  matchId: string // Alias pour history.handler compatibility
  duoId: number

  // Timing
  startTime: Date
  endTime: Date
  createdAt: Date // Alias pour history.handler compatibility
  duration: number // en secondes

  // Result
  win: boolean
  scored: boolean // true si déjà scoré

  // KDA - String format pour display rapide
  noobKDA: string // Format "kills/deaths/assists"
  carryKDA: string

  // KDA - Numbers pour history.handler
  noobKills: number
  noobDeaths: number
  noobAssists: number
  carryKills: number
  carryDeaths: number
  carryAssists: number

  // Champions
  noobChampion: string
  carryChampion: string

  // Scoring (rempli après GAME_RESULT_FOUND)
  pointsAwarded: number // Points totaux du duo
}

export interface GameData {
  // Riot API info
  matchId: string
  gameId: number
  startTime: Date
  endTime: Date | null
  duration: number // en secondes

  // Duo info
  duoId: number

  // Players stats
  noobStats: PlayerGameStats
  carryStats: PlayerGameStats

  // Game result
  win: boolean
  remake: boolean // gameEndedInEarlySurrender
  surrender: boolean // gameEndedInSurrender

  // Status
  status: GameStatus

  // Timestamps
  detectedAt: Date
  scoredAt: Date | null
}

export interface PlayerGameStats {
  // Player identity
  puuid: string
  summonerId: string
  teamId: number // 100 (blue) or 200 (red) - CRITICAL: used to verify duo players are in same team

  // Champion
  championId: number
  championName: string
  lane: Lane

  // KDA
  kills: number
  deaths: number
  assists: number

  // Multikills (optionnels - pour bonus spéciaux)
  pentaKills?: number
  quadraKills?: number
  tripleKills?: number
  firstBloodKill?: boolean
  largestKillingSpree?: number

  // Rank change
  previousRank: RankInfo
  newRank: RankInfo
  peakElo?: string // Peak elo du joueur (ex: "D4", "P2") - pour multiplicateur peak elo (optionnel, défaut = current rank)

  // Risk detection
  isOffRole: boolean // Pas sur son main role
  isOffChampion: boolean // Pas sur son main champion
}
