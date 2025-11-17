/**
 * Calcul des bonus/malus de streaks
 * Formules (v3.0 - Refonte scoring):
 *
 * NOUVEAU: Système PROGRESSIF + bonus ponctuels
 *
 * Bonus progressif (à chaque game):
 * - 2 wins: +2 pts par game
 * - 3 wins: +3 pts par game
 * - 4 wins: +4 pts par game
 * - 5 wins: +5 pts par game
 * - 6 wins: +6 pts par game
 * - 7+ wins: +7 pts par game (max)
 *
 * Bonus ponctuels (quand on atteint le seuil):
 * - 3 wins consécutives: +10 points
 * - 5 wins consécutives: +20 points
 * - 7 wins consécutives: +30 points
 *
 * Malus progressif (à chaque game):
 * - 2 losses: -2 pts par game
 * - 3 losses: -3 pts par game
 * - 4 losses: -4 pts par game
 * - 5+ losses: -5 pts par game (max)
 *
 * Malus ponctuels (quand on atteint le seuil):
 * - 3 losses consécutives: -10 points
 * - 5 losses consécutives: -25 points
 *
 * Les bonus progressifs et ponctuels se cumulent.
 * Exemple: à la 3ème victoire d'affilée, on obtient +3 (progressif) + 10 (ponctuel) = 13 pts
 */

export interface StreakBonus {
  progressive: number // Bonus/malus progressif selon le nombre de games
  milestone: number // Bonus/malus ponctuel si seuil atteint
  total: number // Somme des deux
  newStreak: number // Nouveau streak après cette game
}

/**
 * Calcule le bonus/malus de streak pour cette game (progressif + ponctuel)
 * @param win - true si victoire, false si défaite
 * @param currentStreak - streak AVANT cette game (positif = wins, négatif = losses)
 * @returns StreakBonus avec détail progressif et ponctuel
 */
export function calculateStreakBonus(win: boolean, currentStreak: number): StreakBonus {
  // Calcul du nouveau streak après cette game
  let newStreak: number

  if (win) {
    newStreak = currentStreak >= 0 ? currentStreak + 1 : 1 // Reset si changement
  } else {
    newStreak = currentStreak <= 0 ? currentStreak - 1 : -1 // Reset si changement
  }

  let progressive = 0
  let milestone = 0

  if (win) {
    // BONUS PROGRESSIF (win streaks)
    if (newStreak >= 7) {
      progressive = 7
    } else if (newStreak === 6) {
      progressive = 6
    } else if (newStreak === 5) {
      progressive = 5
    } else if (newStreak === 4) {
      progressive = 4
    } else if (newStreak === 3) {
      progressive = 3
    } else if (newStreak === 2) {
      progressive = 2
    }

    // BONUS PONCTUELS (milestones)
    if (newStreak === 3) {
      milestone = 10
    } else if (newStreak === 5) {
      milestone = 20
    } else if (newStreak === 7) {
      milestone = 30
    }
  } else {
    // MALUS PROGRESSIF (loss streaks)
    const absStreak = Math.abs(newStreak)
    if (absStreak >= 5) {
      progressive = -5
    } else if (absStreak === 4) {
      progressive = -4
    } else if (absStreak === 3) {
      progressive = -3
    } else if (absStreak === 2) {
      progressive = -2
    }

    // MALUS PONCTUELS (milestones)
    if (newStreak === -3) {
      milestone = -10
    } else if (newStreak === -5) {
      milestone = -25
    }
  }

  const total = progressive + milestone

  return {
    progressive,
    milestone,
    total,
    newStreak,
  }
}
