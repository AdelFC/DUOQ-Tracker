/**
 * Types pour le système de scoring
 * Basé sur SPECIFICATIONS.md v2.1
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
  basePoints: number // +30 victoire, -15 défaite
  streakBonus: number // 0 à +15
  final: number
}

export interface RankChangeScore {
  lpChange: number // LP gagnés/perdus
  multiplier: number // x1 à x3 selon rang
  tierBonus: number // +10 tier up, -5 tier down
  final: number
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
  rankChange: RankChangeScore
  subtotal: number // Somme des 3
  capped: number // Après plafond individuel [-40, 80]
  final: number // Arrondi
}

export interface DuoScore {
  noobScore: PlayerScore
  carryScore: PlayerScore
  sum: number // noob + carry
  riskBonus: RiskBonus
  noDeathBonus: number
  subtotal: number // sum + risk + noDeathBonus
  capped: number // Après plafond duo [-50, 120]
  final: number // Arrondi
}

export interface ScoreBreakdown {
  noob: PlayerScore
  carry: PlayerScore
  duo: DuoScore
  total: number // Points finaux attribués au duo
}

export interface ScoringContext {
  noobStats: PlayerGameStats
  carryStats: PlayerGameStats
  noobStreak: number
  carryStreak: number
  win: boolean
}
