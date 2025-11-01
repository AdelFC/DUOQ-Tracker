/**
 * Calcul du multiplicateur de rank pour équilibrer les duos déséquilibrés
 *
 * Système :
 * - Calculer la moyenne de rank du duo
 * - Si joueur < moyenne - 1 tier (4 divisions) → multiplicateur réduit
 * - Le joueur avec le RANK LE PLUS ÉLEVÉ n'est jamais pénalisé
 *
 * Formule de réduction :
 * - Distance = threshold - playerValue
 * - Si distance > 0 : multiplier = max(0.5, 1.0 - distance * 0.05)
 * - Sinon : multiplier = 1.0
 */

import type { RankInfo } from '../../types/player.js'
import { rankToValue } from './rank-utils.js'

const TIER_IN_DIVISIONS = 4 // 1 tier = 4 divisions
const REDUCTION_PER_DIVISION = 0.05 // 5% par division
const MIN_MULTIPLIER = 0.5 // Minimum 50%

/**
 * Calcule le multiplicateur de rank pour un joueur
 * Le joueur avec le rank le plus élevé n'est JAMAIS pénalisé
 * @param playerRank - Rank du joueur à évaluer
 * @param partnerRank - Rank du partenaire
 * @returns Multiplicateur entre 0.5 et 1.0
 */
export function calculatePlayerRankMultiplier(playerRank: RankInfo, partnerRank: RankInfo): number {
  const playerValue = rankToValue(playerRank)
  const partnerValue = rankToValue(partnerRank)

  // Le joueur avec le rank le plus élevé n'est jamais pénalisé
  if (playerValue >= partnerValue) {
    return 1.0
  }

  // Calculer la moyenne du duo
  const average = (playerValue + partnerValue) / 2

  // Calculer le seuil (moyenne - 1 tier)
  const threshold = average - TIER_IN_DIVISIONS

  // Si le joueur est au-dessus ou égal au seuil → pas de réduction
  if (playerValue >= threshold) {
    return 1.0
  }

  // Calculer la distance sous le seuil
  const distance = threshold - playerValue

  // Appliquer la réduction progressive
  const multiplier = 1.0 - distance * REDUCTION_PER_DIVISION

  // Capper au minimum
  return Math.max(MIN_MULTIPLIER, multiplier)
}

/**
 * Alias pour compatibilité - deprecated
 * @deprecated Utiliser calculatePlayerRankMultiplier
 */
export function calculateRankMultiplier(
  playerRank: RankInfo,
  partnerRank: RankInfo,
  _role: string
): number {
  return calculatePlayerRankMultiplier(playerRank, partnerRank)
}

/**
 * Calcule les multiplicateurs pour les deux joueurs du duo
 * @param noobRank - Rank du noob
 * @param carryRank - Rank du carry
 * @returns { noobMultiplier, carryMultiplier }
 */
export function calculateDuoMultipliers(noobRank: RankInfo, carryRank: RankInfo) {
  return {
    noobMultiplier: calculatePlayerRankMultiplier(noobRank, carryRank),
    carryMultiplier: calculatePlayerRankMultiplier(carryRank, noobRank),
  }
}
