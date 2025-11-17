/**
 * Calcul du bonus de prise de risque (DUO)
 * Formules (v3.0 - Refonte scoring):
 *
 * Évaluation (4 conditions):
 * 1. Noob hors rôle principal?
 * 2. Noob hors champion principal?
 * 3. Carry hors rôle principal?
 * 4. Carry hors champion principal?
 *
 * H = nombre de conditions vraies
 *
 * Bonus selon H:
 * - H = 4: +15 points
 * - H = 3: +10 points
 * - H ≤ 2: 0 points
 */

import type { RiskBonus } from '../../types/scoring.js'

interface RiskInput {
  noobOffRole: boolean
  noobOffChampion: boolean
  carryOffRole: boolean
  carryOffChampion: boolean
}

/**
 * Calcule le bonus de prise de risque pour le duo
 * @param input - Conditions de risque
 * @returns RiskBonus avec breakdown
 */
export function calculateRiskBonus(input: RiskInput): RiskBonus {
  const { noobOffRole, noobOffChampion, carryOffRole, carryOffChampion } = input

  // Comptage des conditions vraies
  const H = [noobOffRole, noobOffChampion, carryOffRole, carryOffChampion].filter(Boolean).length

  // Calcul du bonus selon H (v3.0)
  let final: number

  if (H === 4) {
    final = 15
  } else if (H === 3) {
    final = 10
  } else {
    // H <= 2
    final = 0
  }

  // Breakdown détaillé
  const offRoleCount = [noobOffRole, carryOffRole].filter(Boolean).length
  const offChampionCount = [noobOffChampion, carryOffChampion].filter(Boolean).length

  return {
    offRole: offRoleCount,
    offChampion: offChampionCount,
    final,
  }
}
