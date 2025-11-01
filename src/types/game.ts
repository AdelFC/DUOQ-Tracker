/**
 * Types pour les games trackées
 */

import type { Lane, RankInfo } from './player.js'

export type GameStatus = 'IN_PROGRESS' | 'COMPLETED' | 'SCORED'

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

  // Rank change
  previousRank: RankInfo
  newRank: RankInfo

  // Risk detection
  isOffRole: boolean // Pas sur son main role
  isOffChampion: boolean // Pas sur son main champion
}

export interface Game {
  id: number
  matchId: string
  duoId: number

  // Game info
  startTime: Date
  endTime: Date
  duration: number
  win: boolean

  // Stats
  noobKills: number
  noobDeaths: number
  noobAssists: number
  noobChampionId: number
  noobLane: Lane
  noobPreviousRank: string // Serialized RankInfo
  noobNewRank: string // Serialized RankInfo

  carryKills: number
  carryDeaths: number
  carryAssists: number
  carryChampionId: number
  carryLane: Lane
  carryPreviousRank: string
  carryNewRank: string

  // Points
  pointsAwarded: number
  breakdown: string // JSON serialized ScoreBreakdown

  // Timestamps
  createdAt: Date
}
