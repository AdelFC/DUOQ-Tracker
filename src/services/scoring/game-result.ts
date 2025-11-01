/**
 * Calcul du score de résultat de partie
 * Formules (SPECIFICATIONS.md v2.1 - Section 2):
 * - Victoire standard: +5 points
 * - Victoire rapide (< 25 min): +8 points
 * - Défaite: -5 points
 * - FF/Surrender: -10 points
 * - Remake: 0 points
 *
 * Priorité: Remake > FF > Win <25min > Win > Loss
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

  // Priorité d'application (selon spec)
  if (remake) {
    // Remake = 0 points (priorité max)
    basePoints = 0
  } else if (surrender && !win) {
    // FF/Surrender = -10 points (uniquement sur défaite)
    basePoints = -10
  } else if (win && duration < 1500) {
    // Victoire rapide < 25:00 (1500 sec) = +8 points
    basePoints = 8
  } else if (win) {
    // Victoire standard = +5 points
    basePoints = 5
  } else {
    // Défaite standard = -5 points
    basePoints = -5
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
