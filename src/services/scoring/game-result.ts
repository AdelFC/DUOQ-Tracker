/**
 * Calcul du score de résultat de partie
 * Formules (v3.0 - Refonte scoring):
 * - Victoire rapide (< 20 min): +25 points
 * - Victoire standard: +20 points
 * - Défaite standard: -20 points
 * - FF/Surrender: -30 points
 * - Remake ou < 5 min: 0 points (cas spécial: arrêt du calcul)
 *
 * Priorité: Remake/5min > FF > Win <20min > Win > Loss
 *
 * NOTE: Les streaks sont calculés séparément (module streaks)
 */

import type { GameResultScore } from '../../types/scoring.js'

interface GameResultInput {
  win: boolean
  duration: number // en secondes
  surrender: boolean
  remake: boolean
}

/**
 * Calcule les points liés au résultat de la partie
 * @param input - Données de la game
 * @returns GameResultScore avec breakdown
 */
export function calculateGameResult(input: GameResultInput): GameResultScore {
  const { win, duration, surrender, remake } = input

  let basePoints: number

  // Priorité d'application (selon spec v3.0)
  if (remake) {
    // Remake = 0 points (priorité max, arrêt du calcul dans engine)
    basePoints = 0
  } else if (surrender && !win) {
    // FF/Surrender = -30 points (uniquement sur défaite)
    basePoints = -30
  } else if (win && duration < 1200) {
    // Victoire rapide < 20:00 (1200 sec) = +25 points
    basePoints = 25
  } else if (win) {
    // Victoire standard = +20 points
    basePoints = 20
  } else {
    // Défaite standard = -20 points
    basePoints = -20
  }

  // Pas de streak bonus ici (calculé séparément)
  const streakBonus = 0
  const final = basePoints + streakBonus

  return {
    basePoints,
    streakBonus,
    final,
  }
}
