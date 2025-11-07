/**
 * Calcul des bonus/malus de changement de rank
 * Formules (SPECIFICATIONS.md v2.1 - Section 3):
 * Montée:
 * - +1 division: +50 points
 * - +1 tier: +100 points
 *
 * Descente (double malus):
 * - -1 division: -100 points
 * - -1 tier: -200 points
 *
 * LP Conversion (v2.2):
 * - 1 LP = 0.4 point
 * - ±20 LP = ±8 points
 * - S'applique uniquement si pas de changement de division/tier
 */

import type { RankInfo } from '../../types/player.js'
import type { RankChangeScore } from '../../types/scoring.js'

// Ordre des tiers (0 = plus bas, plus élevé = meilleur)
const TIER_ORDER: Record<string, number> = {
  IRON: 0,
  BRONZE: 1,
  SILVER: 2,
  GOLD: 3,
  PLATINUM: 4,
  EMERALD: 5,
  DIAMOND: 6,
  MASTER: 7,
  GRANDMASTER: 8,
  CHALLENGER: 9,
}

// Ordre des divisions (IV = 0, III = 1, II = 2, I = 3)
const DIVISION_ORDER: Record<string, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
}

// Conversion LP → Points
const LP_TO_POINTS = 0.4 // 1 LP = 0.4 point (±20 LP = ±8 points)

/**
 * Calcule le bonus/malus de changement de rank
 * @param previous - Rank avant la game
 * @param current - Rank après la game
 * @returns RankChangeScore avec breakdown
 */
export function calculateRankChange(previous: RankInfo, current: RankInfo): RankChangeScore {
  const prevTierValue = TIER_ORDER[previous.tier]
  const currTierValue = TIER_ORDER[current.tier]

  let tierBonus = 0
  let lpBonus = 0

  // Changement de tier
  if (currTierValue > prevTierValue) {
    // Montée de tier
    tierBonus = 100
  } else if (currTierValue < prevTierValue) {
    // Descente de tier (double malus)
    tierBonus = -200
  } else {
    // Même tier → vérifier changement de division
    // (uniquement pour les tiers avec divisions)
    if (previous.division && current.division) {
      const prevDivValue = DIVISION_ORDER[previous.division]
      const currDivValue = DIVISION_ORDER[current.division]

      if (currDivValue > prevDivValue) {
        // Montée de division
        tierBonus = 50
      } else if (currDivValue < prevDivValue) {
        // Descente de division (double malus)
        tierBonus = -100
      } else {
        // Même division → calculer variation LP
        const lpDelta = current.lp - previous.lp
        lpBonus = lpDelta * LP_TO_POINTS
      }
    } else {
      // Master+ (pas de divisions) → toujours calculer variation LP
      const lpDelta = current.lp - previous.lp
      lpBonus = lpDelta * LP_TO_POINTS
    }
  }

  const finalScore = tierBonus + lpBonus

  return {
    lpChange: lpBonus,
    multiplier: 1, // Pas de multiplier dans ce module
    tierBonus,
    final: finalScore,
  }
}
