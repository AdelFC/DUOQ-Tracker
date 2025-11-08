/**
 * Bonus spéciaux
 * Formules (SPECIFICATIONS.md v2.1 - Section 6):
 *
 * Bonus Duo "No Death":
 * - Condition: Les 2 joueurs du duo ont 0 death
 * - Bonus: +20 points au duo
 *
 * Bonus Individuels:
 * - Pentakill: +30 pts
 * - Quadrakill: +15 pts
 * - Triple kill: +5 pts
 * - First Blood: +5 pts
 * - Killing Spree (7+ kills sans mourir): +10 pts
 */

import type { PlayerGameStats } from '../../types/game.js'

/**
 * Calcule le bonus "No Death" si les deux joueurs n'ont aucune mort
 * @param noobDeaths - Nombre de morts du noob
 * @param carryDeaths - Nombre de morts du carry
 * @returns +20 si les deux ont 0 mort, 0 sinon
 */
export function calculateNoDeathBonus(noobDeaths: number, carryDeaths: number): number {
  if (noobDeaths === 0 && carryDeaths === 0) {
    return 20
  }
  return 0
}

/**
 * Calcule les bonus spéciaux individuels d'un joueur
 * (Pentakill, Quadra, Triple, First Blood, Killing Spree)
 *
 * @param stats - Stats du joueur
 * @returns Points de bonus spéciaux
 */
export function calculatePlayerSpecialBonus(stats: PlayerGameStats): number {
  let bonus = 0

  // Pentakill: +30 pts (max prioritaire)
  if (stats.pentaKills && stats.pentaKills > 0) {
    bonus += 30 * stats.pentaKills
  }

  // Quadrakill: +15 pts (ne compte pas si pentakill car déjà récompensé)
  else if (stats.quadraKills && stats.quadraKills > 0) {
    bonus += 15 * stats.quadraKills
  }

  // Triple kill: +5 pts (ne compte pas si quadra/penta)
  else if (stats.tripleKills && stats.tripleKills > 0) {
    bonus += 5 * stats.tripleKills
  }

  // First Blood: +5 pts
  if (stats.firstBloodKill) {
    bonus += 5
  }

  // Killing Spree (7+ kills d'affilée): +10 pts
  if (stats.largestKillingSpree && stats.largestKillingSpree >= 7) {
    bonus += 10
  }

  return bonus
}
