/**
 * Calcul du multiplicateur Peak Elo
 *
 * Système hybride avec:
 * - BONUS pour les joueurs qui dépassent leur peak elo (encourage la progression)
 * - MALUS pour les joueurs en dessous de leur peak elo (anti-smurf)
 * - TOLÉRANCE pour 0-1 tier en dessous (normal decay, meta shifts)
 *
 * Formule:
 * - Au-dessus du peak:
 *   - +3 tiers: x1.15 (+15% bonus max)
 *   - +2 tiers: x1.10 (+10% bonus)
 *   - +1 tier:  x1.05 (+5% bonus)
 *
 * - À son peak ou proche:
 *   - 0-1 tier dessous: x1.00 (tolérance)
 *
 * - En dessous du peak:
 *   - 2 tiers:  x0.95  (-5% malus)
 *   - 3 tiers:  x0.875 (-12.5% malus)
 *   - 4 tiers:  x0.80  (-20% malus)
 *   - 5+ tiers: x0.75  (-25% malus max)
 */

import { rankToValue, parseRankString } from './rank-utils.js'
import type { RankInfo } from '../../types/player.js'

/**
 * Calcule le multiplicateur basé sur le peak elo du joueur
 * @param peakElo - Peak elo du joueur (ex: "D4", "P2"). Si undefined/vide, considère peak = current (1.0x)
 * @param currentRank - Rank actuel du joueur
 * @returns Multiplicateur entre 0.75 et 1.15
 */
export function calculatePeakEloMultiplier(peakElo: string | undefined, currentRank: RankInfo): number {
  // Si pas de peakElo fourni, on considère que peak = current rank (pas de bonus/malus)
  if (!peakElo) {
    return 1.0
  }

  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  // Calculer l'écart en tiers
  // Positif = en dessous du peak, Négatif = au-dessus du peak
  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  // BONUS si au-dessus du peak elo (encourage la progression!)
  if (tierDiff < 0) {
    const tierAbove = Math.abs(tierDiff)
    if (tierAbove >= 3) return 1.15 // +15% bonus max
    if (tierAbove === 2) return 1.10 // +10% bonus
    if (tierAbove === 1) return 1.05 // +5% bonus
  }

  // TOLÉRANCE: 0-1 tier en dessous (normal decay, meta shifts)
  if (tierDiff <= 1) return 1.0

  // MALUS si en dessous du peak elo (anti-smurf)
  if (tierDiff === 2) return 0.95 // -5%
  if (tierDiff === 3) return 0.875 // -12.5%
  if (tierDiff === 4) return 0.80 // -20%
  if (tierDiff >= 5) return 0.75 // -25% max

  return 1.0
}
