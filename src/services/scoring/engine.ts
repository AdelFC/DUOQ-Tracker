/**
 * Scoring Engine Principal
 * Orchestre tous les modules de scoring selon l'ordre strict (Section 8)
 */

import { calculateKDA } from './kda.js'
import { calculateGameResult } from './game-result.js'
import { calculateStreakBonus } from './streaks.js'
import { calculateRankChange } from './rank-change.js'
import { calculateRiskBonus } from './risk.js'
import { calculateNoDeathBonus, calculatePlayerSpecialBonus } from './bonuses.js'
import { applyPlayerCap, applyDuoCap } from './caps.js'
import { calculatePeakEloMultiplier } from './peak-elo-multiplier.js'

import type { PlayerGameStats, GameData } from '../../types/game.js'
import type { ScoreBreakdown, PlayerScore, DuoScore } from '../../types/scoring.js'

interface ScoringInput {
  gameData: GameData
  noobStreak: number // Streak AVANT cette game
  carryStreak: number
}

/**
 * Calcule le score complet pour une game selon l'ordre strict des specs
 * @param input - Données de la game et streaks
 * @returns ScoreBreakdown avec tous les détails
 */
export function calculateGameScore(input: ScoringInput): ScoreBreakdown {
  const { gameData, noobStreak, carryStreak } = input
  const { noobStats, carryStats, win, duration } = gameData

  // ┌─────────────────────────────────────────────────────────┐
  // │ CALCUL INDIVIDUEL - NOOB                                │
  // └─────────────────────────────────────────────────────────┘

  // 1. P_KDA
  const noobKDA = calculateKDA(
    { kills: noobStats.kills, deaths: noobStats.deaths, assists: noobStats.assists },
    'noob'
  )

  // 2. Résultat de game
  const noobGameResult = calculateGameResult({
    win,
    duration,
    surrender: gameData.surrender,
    remake: gameData.remake,
  })

  // 3. Streak
  const noobStreakBonus = calculateStreakBonus(win, noobStreak)

  // 4. Rank change
  const noobRankChange = calculateRankChange(noobStats.previousRank, noobStats.newRank)

  // 5. Bonus spéciaux individuels (Pentakill, Quadra, Triple, First Blood, Killing Spree)
  const noobSpecialBonus = calculatePlayerSpecialBonus(noobStats)

  // 6. Sous-total
  const noobSubtotal =
    noobKDA.final +
    noobGameResult.final +
    noobStreakBonus +
    noobRankChange.final +
    noobSpecialBonus

  // 7. Plafond individuel
  const noobCapped = applyPlayerCap(noobSubtotal)

  // 7.5. Multiplicateur peak elo (anti-smurf + bonus progression)
  const noobPeakMultiplier = calculatePeakEloMultiplier(noobStats.peakElo, noobStats.newRank)
  const noobAfterPeakMultiplier = noobCapped * noobPeakMultiplier

  // 8. Arrondi à l'entier
  const noobFinal = Math.round(noobAfterPeakMultiplier)

  const noobScore: PlayerScore = {
    kda: noobKDA,
    gameResult: noobGameResult,
    rankChange: noobRankChange,
    subtotal: noobSubtotal,
    capped: noobCapped,
    final: noobFinal,
  }

  // ┌─────────────────────────────────────────────────────────┐
  // │ CALCUL INDIVIDUEL - CARRY                               │
  // └─────────────────────────────────────────────────────────┘

  // 1. P_KDA
  const carryKDA = calculateKDA(
    { kills: carryStats.kills, deaths: carryStats.deaths, assists: carryStats.assists },
    'carry'
  )

  // 2. Résultat de game
  const carryGameResult = calculateGameResult({
    win,
    duration,
    surrender: gameData.surrender,
    remake: gameData.remake,
  })

  // 3. Streak
  const carryStreakBonus = calculateStreakBonus(win, carryStreak)

  // 4. Rank change
  const carryRankChange = calculateRankChange(carryStats.previousRank, carryStats.newRank)

  // 5. Bonus spéciaux individuels (Pentakill, Quadra, Triple, First Blood, Killing Spree)
  const carrySpecialBonus = calculatePlayerSpecialBonus(carryStats)

  // 6. Sous-total
  const carrySubtotal =
    carryKDA.final +
    carryGameResult.final +
    carryStreakBonus +
    carryRankChange.final +
    carrySpecialBonus

  // 7. Plafond individuel
  const carryCapped = applyPlayerCap(carrySubtotal)

  // 7.5. Multiplicateur peak elo (anti-smurf + bonus progression)
  const carryPeakMultiplier = calculatePeakEloMultiplier(carryStats.peakElo, carryStats.newRank)
  const carryAfterPeakMultiplier = carryCapped * carryPeakMultiplier

  // 8. Arrondi à l'entier
  const carryFinal = Math.round(carryAfterPeakMultiplier)

  const carryScore: PlayerScore = {
    kda: carryKDA,
    gameResult: carryGameResult,
    rankChange: carryRankChange,
    subtotal: carrySubtotal,
    capped: carryCapped,
    final: carryFinal,
  }

  // ┌─────────────────────────────────────────────────────────┐
  // │ CALCUL DUO                                              │
  // └─────────────────────────────────────────────────────────┘

  // 9. Somme duo
  const duoSum = noobFinal + carryFinal

  // 10. Prise de risque
  const riskBonus = calculateRiskBonus({
    noobOffRole: noobStats.isOffRole,
    noobOffChampion: noobStats.isOffChampion,
    carryOffRole: carryStats.isOffRole,
    carryOffChampion: carryStats.isOffChampion,
  })

  // 11. Bonus spéciaux duo
  const noDeathBonus = calculateNoDeathBonus(noobStats.deaths, carryStats.deaths)

  // 12. Sous-total duo
  const duoSubtotal = duoSum + riskBonus.final + noDeathBonus

  // 13. Plafond duo
  const duoCapped = applyDuoCap(duoSubtotal)

  // 14. Arrondi final
  const duoFinal = Math.round(duoCapped)

  const duoScore: DuoScore = {
    noobScore,
    carryScore,
    sum: duoSum,
    riskBonus,
    noDeathBonus,
    subtotal: duoSubtotal,
    capped: duoCapped,
    final: duoFinal,
  }

  return {
    noob: noobScore,
    carry: carryScore,
    duo: duoScore,
    total: duoFinal,
  }
}
