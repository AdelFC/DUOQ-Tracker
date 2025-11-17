/**
 * Scoring Engine Principal
 * Orchestre tous les modules de scoring selon l'ordre strict (v3.0 - Refonte scoring)
 */

import { calculateKDA } from './kda.js'
import { calculateGameResult } from './game-result.js'
import { calculateStreakBonus } from './streaks.js'
import { calculateRiskBonus } from './risk.js'
import { calculateNoDeathBonus, calculatePlayerSpecialBonus } from './bonuses.js'
import { applyPlayerCap, applyDuoCap } from './caps.js'
import { calculatePeakEloMultiplier } from './peak-elo-multiplier.js'
import { rankToValue, parseRankString } from './rank-utils.js'

import type { PlayerGameStats, GameData } from '../../types/game.js'
import type {
  ScoreBreakdown,
  PlayerScore,
  DuoScore,
  SpecialAlert,
  PeakEloMultiplier,
} from '../../types/scoring.js'

interface ScoringInput {
  gameData: GameData
  noobStreak: number // Streak AVANT cette game
  carryStreak: number
}

/**
 * Calcule le score complet pour une game selon l'ordre strict des specs v3.0
 * @param input - Données de la game et streaks
 * @returns ScoreBreakdown avec tous les détails
 */
export function calculateGameScore(input: ScoringInput): ScoreBreakdown {
  const { gameData, noobStreak, carryStreak } = input
  const { noobStats, carryStats, win, duration, remake, surrender } = gameData

  // ┌─────────────────────────────────────────────────────────┐
  // │ CAS SPÉCIAL: REMAKE OU PARTIE < 5 MIN                   │
  // └─────────────────────────────────────────────────────────┘

  // Si remake ou partie < 5 minutes: 0 points, arrêt du calcul
  if (remake || duration < 300) {
    const emptyPlayerScore: PlayerScore = {
      kda: { base: 0, roleAdjustment: 0, final: 0 },
      gameResult: { basePoints: 0, streakBonus: 0, final: 0 },
      streak: { progressive: 0, milestone: 0, total: 0 },
      specialBonuses: {
        pentakill: 0,
        quadrakill: 0,
        tripleKill: 0,
        firstBlood: 0,
        killingSpree: 0,
        total: 0,
      },
      subtotal: 0,
      capped: 0,
      peakMultiplier: { multiplier: 1.0, tierDiff: 0 },
      final: 0,
    }

    const emptyDuoScore: DuoScore = {
      noobScore: emptyPlayerScore,
      carryScore: emptyPlayerScore,
      sum: 0,
      riskBonus: { offRole: 0, offChampion: 0, final: 0 },
      noDeathBonus: 0,
      subtotal: 0,
      capped: 0,
      final: 0,
    }

    return {
      noob: emptyPlayerScore,
      carry: emptyPlayerScore,
      duo: emptyDuoScore,
      total: 0,
      alerts: [],
      isRemakeOrEarlyGame: true,
    }
  }

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
    surrender,
    remake,
  })

  // 3. Streak (progressif + ponctuel)
  const noobStreakResult = calculateStreakBonus(win, noobStreak)

  // 4. Bonus spéciaux individuels (Pentakill, Quadra, Triple, First Blood, Killing Spree)
  const noobSpecialBonus = calculatePlayerSpecialBonus(noobStats)

  // 5. Sous-total
  const noobSubtotal =
    noobKDA.final + noobGameResult.final + noobStreakResult.total + noobSpecialBonus.total

  // 6. Plafond individuel
  const noobCapped = applyPlayerCap(noobSubtotal)

  // 7. Multiplicateur peak elo (anti-smurf + bonus progression)
  const noobPeakMult = calculatePeakEloMultiplier(noobStats.peakElo, noobStats.newRank)
  const noobAfterPeakMultiplier = noobCapped * noobPeakMult

  // Calcul du tierDiff pour le breakdown
  const noobPeakValue = noobStats.peakElo
    ? rankToValue(parseRankString(noobStats.peakElo))
    : rankToValue(noobStats.newRank)
  const noobCurrentValue = rankToValue(noobStats.newRank)
  const noobTierDiff = Math.floor((noobPeakValue - noobCurrentValue) / 4)

  const noobPeakMultiplier: PeakEloMultiplier = {
    multiplier: noobPeakMult,
    tierDiff: noobTierDiff,
  }

  // 8. Arrondi à l'entier
  const noobFinal = Math.round(noobAfterPeakMultiplier)

  const noobScore: PlayerScore = {
    kda: noobKDA,
    gameResult: noobGameResult,
    streak: noobStreakResult,
    specialBonuses: noobSpecialBonus,
    subtotal: noobSubtotal,
    capped: noobCapped,
    peakMultiplier: noobPeakMultiplier,
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
    surrender,
    remake,
  })

  // 3. Streak (progressif + ponctuel)
  const carryStreakResult = calculateStreakBonus(win, carryStreak)

  // 4. Bonus spéciaux individuels (Pentakill, Quadra, Triple, First Blood, Killing Spree)
  const carrySpecialBonus = calculatePlayerSpecialBonus(carryStats)

  // 5. Sous-total
  const carrySubtotal =
    carryKDA.final + carryGameResult.final + carryStreakResult.total + carrySpecialBonus.total

  // 6. Plafond individuel
  const carryCapped = applyPlayerCap(carrySubtotal)

  // 7. Multiplicateur peak elo (anti-smurf + bonus progression)
  const carryPeakMult = calculatePeakEloMultiplier(carryStats.peakElo, carryStats.newRank)
  const carryAfterPeakMultiplier = carryCapped * carryPeakMult

  // Calcul du tierDiff pour le breakdown
  const carryPeakValue = carryStats.peakElo
    ? rankToValue(parseRankString(carryStats.peakElo))
    : rankToValue(carryStats.newRank)
  const carryCurrentValue = rankToValue(carryStats.newRank)
  const carryTierDiff = Math.floor((carryPeakValue - carryCurrentValue) / 4)

  const carryPeakMultiplier: PeakEloMultiplier = {
    multiplier: carryPeakMult,
    tierDiff: carryTierDiff,
  }

  // 8. Arrondi à l'entier
  const carryFinal = Math.round(carryAfterPeakMultiplier)

  const carryScore: PlayerScore = {
    kda: carryKDA,
    gameResult: carryGameResult,
    streak: carryStreakResult,
    specialBonuses: carrySpecialBonus,
    subtotal: carrySubtotal,
    capped: carryCapped,
    peakMultiplier: carryPeakMultiplier,
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

  // ┌─────────────────────────────────────────────────────────┐
  // │ ALERTES SPÉCIALES                                       │
  // └─────────────────────────────────────────────────────────┘

  const alerts: SpecialAlert[] = []

  // Alerte Pentakill
  if (noobSpecialBonus.pentakill > 0) {
    alerts.push({
      type: 'pentakill',
      player: 'noob',
      message: '🔥 PENTAKILL du Noob ! +30 pts 🔥',
    })
  }

  if (carrySpecialBonus.pentakill > 0) {
    alerts.push({
      type: 'pentakill',
      player: 'carry',
      message: '🔥 PENTAKILL du Carry ! +30 pts 🔥',
    })
  }

  // Alerte No Death
  if (noDeathBonus > 0) {
    alerts.push({
      type: 'no_death',
      message: '💎 Duo sans aucune mort ! +20 pts 💎',
    })
  }

  // Alerte Surrender
  if (surrender && !win) {
    alerts.push({
      type: 'surrender',
      message: '🏳️ Cette duo a FF pour plus de fun ! -30 pts 🏳️',
    })
  }

  return {
    noob: noobScore,
    carry: carryScore,
    duo: duoScore,
    total: duoFinal,
    alerts,
    isRemakeOrEarlyGame: false,
  }
}
