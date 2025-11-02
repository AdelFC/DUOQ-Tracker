/**
 * Types pour les joueurs du challenge DuoQ
 */

export type Role = 'noob' | 'carry'

export type Rank =
  | 'IRON'
  | 'BRONZE'
  | 'SILVER'
  | 'GOLD'
  | 'PLATINUM'
  | 'EMERALD'
  | 'DIAMOND'
  | 'MASTER'
  | 'GRANDMASTER'
  | 'CHALLENGER'

export type Division = 'IV' | 'III' | 'II' | 'I'

export type Lane = 'TOP' | 'JUNGLE' | 'MIDDLE' | 'BOTTOM' | 'UTILITY'

export interface RankInfo {
  tier: Rank
  division: Division | null // null pour Master+
  lp: number
}

export interface MainRole {
  lane: Lane
  championId: number
  championName: string
}

export interface Streaks {
  current: number // Positive = win streak, negative = loss streak
  longestWin: number
  longestLoss: number
}

export interface Player {
  // Identity
  discordId: string
  puuid: string // Rempli après appel Riot API
  gameName: string
  tagLine: string

  // Challenge info
  role: Role // noob ou carry (déterminé lors du /link)
  duoId: number // Foreign key to duo (0 si pas en duo)

  // Rank info
  peakElo: string // Elo de référence pour balancing duo (ex: "G2")
  initialRank: RankInfo // Rank au moment de /link
  currentRank: RankInfo // Rank actuel trackée

  // Main info (fourni par joueur à /register)
  mainRoleString: string // "TOP", "JUNGLE", "MID", "ADC", "SUPPORT"
  mainChampion: string // "Yasuo", "Jinx", etc.
  detectedMainRole: MainRole | null // Détecté après analyse des games

  // Stats
  totalPoints: number
  gamesPlayed: number
  wins: number
  losses: number
  streaks: Streaks

  // Timestamps
  registeredAt: Date
  lastGameAt: Date | null
}

export interface PlayerStats {
  // KDA
  kills: number
  deaths: number
  assists: number

  // Game info
  championId: number
  championName: string
  lane: Lane
  win: boolean

  // Rank change
  previousRank: RankInfo
  newRank: RankInfo
}
