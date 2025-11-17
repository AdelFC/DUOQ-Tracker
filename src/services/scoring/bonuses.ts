/**
 * Bonus spéciaux
 * Formules (v3.0 - Refonte scoring):
 *
 * Bonus Duo "No Death":
 * - Condition: Les 2 joueurs du duo ont 0 death
 * - Bonus: +20 points au duo
 *
 * Bonus Individuels:
 * - Pentakill: +30 pts
 * - Quadrakill: +15 pts (si pas de penta)
 * - Triple kill: +5 pts (si pas de quadra/penta)
 * - First Blood: +5 pts (cumulatif)
 * - Killing Spree (7+ kills): +10 pts (cumulatif)
 */

import type { PlayerGameStats } from '../../types/game.js'
import type { SpecialBonuses } from '../../types/scoring.js'

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
 * @returns SpecialBonuses avec breakdown détaillé
 */
export function calculatePlayerSpecialBonus(stats: PlayerGameStats): SpecialBonuses {
  let pentakill = 0
  let quadrakill = 0
  let tripleKill = 0
  let firstBlood = 0
  let killingSpree = 0

  // Pentakill: +30 pts (max prioritaire)
  if (stats.pentaKills && stats.pentaKills > 0) {
    pentakill = 30 * stats.pentaKills
  }

  // Quadrakill: +15 pts (ne compte pas si pentakill car déjà récompensé)
  else if (stats.quadraKills && stats.quadraKills > 0) {
    quadrakill = 15 * stats.quadraKills
  }

  // Triple kill: +5 pts (ne compte pas si quadra/penta)
  else if (stats.tripleKills && stats.tripleKills > 0) {
    tripleKill = 5 * stats.tripleKills
  }

  // First Blood: +5 pts (cumulatif)
  if (stats.firstBloodKill) {
    firstBlood = 5
  }

  // Killing Spree (7+ kills d'affilée): +10 pts (cumulatif)
  if (stats.largestKillingSpree && stats.largestKillingSpree >= 7) {
    killingSpree = 10
  }

  const total = pentakill + quadrakill + tripleKill + firstBlood + killingSpree

  return {
    pentakill,
    quadrakill,
    tripleKill,
    firstBlood,
    killingSpree,
    total,
  }
}
