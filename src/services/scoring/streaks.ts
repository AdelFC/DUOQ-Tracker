/**
 * Calcul des bonus/malus de streaks
 * Formules (SPECIFICATIONS.md v2.1 - Section 4):
 * Win Streaks:
 * - 3 wins consécutives: +10 points
 * - 5 wins consécutives: +25 points
 * - 7 wins consécutives: +50 points
 *
 * Lose Streaks:
 * - 3 losses consécutives: -10 points
 * - 5 losses consécutives: -25 points
 *
 * Le bonus/malus s'applique sur la game qui atteint le seuil
 */

/**
 * Calcule le bonus/malus de streak pour cette game
 * @param win - true si victoire, false si défaite
 * @param currentStreak - streak AVANT cette game (positif = wins, négatif = losses)
 * @returns Points de bonus/malus (0 si pas de seuil atteint)
 */
export function calculateStreakBonus(win: boolean, currentStreak: number): number {
  // Calcul du nouveau streak après cette game
  let newStreak: number

  if (win) {
    newStreak = currentStreak >= 0 ? currentStreak + 1 : 1 // Reset si changement
  } else {
    newStreak = currentStreak <= 0 ? currentStreak - 1 : -1 // Reset si changement
  }

  // Vérification des seuils
  if (win) {
    // Win streaks
    if (newStreak === 3) return 10
    if (newStreak === 5) return 25
    if (newStreak === 7) return 50
  } else {
    // Loss streaks
    if (newStreak === -3) return -10
    if (newStreak === -5) return -25
  }

  return 0
}
