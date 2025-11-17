/**
 * Types pour le système de scoring
 * Basé sur v3.0 - Refonte scoring
 */

import type { Role, RankInfo } from './player.js'
import type { PlayerGameStats } from './game.js'

export interface KDAInput {
  kills: number
  deaths: number
  assists: number
}

export interface KDAScore {
  base: number // P_base = K + 0.5*A - D
  roleAdjustment: number // Bonus noob ou malus carry
  final: number // Score après ajustement
}

export interface GameResultScore {
  basePoints: number // v3.0: +25 victoire rapide, +20 victoire, -20 défaite, -30 surrender
  streakBonus: number // Deprecated v3.0 (toujours 0, streaks calculés séparément)
  final: number
}

export interface StreakScore {
  progressive: number // Bonus/malus progressif (+2 à +7 ou -2 à -5)
  milestone: number // Bonus/malus ponctuel (paliers 3/5/7)
  total: number // Somme des deux
}

export interface SpecialBonuses {
  pentakill: number // +30
  quadrakill: number // +15
  tripleKill: number // +5
  firstBlood: number // +5
  killingSpree: number // +10
  total: number // Somme
}

export interface PeakEloMultiplier {
  multiplier: number // 0.70 à 1.20
  tierDiff: number // Différence en tiers avec le peak
}

export interface RiskBonus {
  offRole: number // +5 par joueur off-role
  offChampion: number // +5 par joueur off-champion
  final: number
}

export interface BonusPoints {
  noDeathBonus: number // +15 si duo sans mort
  riskBonus: number // Bonus off-role/champion
  total: number
}

export interface PlayerScore {
  kda: KDAScore
  gameResult: GameResultScore
  streak: StreakScore
  specialBonuses: SpecialBonuses
  subtotal: number // Somme avant cap
  capped: number // Après plafond individuel [-40, 60]
  peakMultiplier: PeakEloMultiplier // Multiplicateur anti-smurf
  final: number // Arrondi après multiplicateur
}

export interface DuoScore {
  noobScore: PlayerScore
  carryScore: PlayerScore
  sum: number // noob + carry
  riskBonus: RiskBonus
  noDeathBonus: number
  subtotal: number // sum + risk + noDeathBonus
  capped: number // Après plafond duo [-70, 120]
  final: number // Arrondi
}

export interface SpecialAlert {
  type: 'pentakill' | 'no_death' | 'surrender'
  player?: 'noob' | 'carry' // Pour pentakill
  message: string
}

export interface ScoreBreakdown {
  noob: PlayerScore
  carry: PlayerScore
  duo: DuoScore
  total: number // Points finaux attribués au duo
  alerts: SpecialAlert[] // Alertes spéciales
  isRemakeOrEarlyGame: boolean // true si remake ou <5min (0 points)
}

export interface ScoringContext {
  noobStats: PlayerGameStats
  carryStats: PlayerGameStats
  noobStreak: number
  carryStreak: number
  win: boolean
}
