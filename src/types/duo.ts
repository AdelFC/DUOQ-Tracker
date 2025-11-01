/**
 * Types pour les duos du challenge
 */

export interface Duo {
  id: number
  name: string // Nom custom du duo (ex: "Les Zinzins")

  // Players
  noobId: string // Discord ID du noob
  carryId: string // Discord ID du carry

  // Stats
  totalPoints: number
  gamesPlayed: number
  wins: number
  losses: number

  // Streaks
  currentStreak: number // Positive = win, negative = loss
  longestWinStreak: number
  longestLossStreak: number

  // Timestamps
  createdAt: Date
  lastGameAt: Date | null
}

export interface DuoRanking {
  rank: number
  duo: Duo
  noobName: string
  carryName: string
  pointsDiff: number // Différence avec le duo précédent
}
