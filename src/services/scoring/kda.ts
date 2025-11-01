/**
 * Calcul du score KDA
 * Formules (SPECIFICATIONS.md v2.1):
 * - Base: P_base = 1.0*K + 0.5*A - 1.0*D
 * - Noob (bonus): P_KDA = P_base + 0.5*K + 0.25*A
 * - Carry (malus): P_KDA = P_base - 0.5*D
 */

import type { KDAInput, KDAScore } from '../../types/scoring.js'
import type { Role } from '../../types/player.js'

export function calculateKDA(input: KDAInput, role: Role): KDAScore {
  const { kills, deaths, assists } = input

  // P_base = 1.0*K + 0.5*A - 1.0*D
  const base = 1.0 * kills + 0.5 * assists - 1.0 * deaths

  // Calcul du bonus/malus selon le rôle
  let roleAdjustment: number

  if (role === 'noob') {
    // Noob reçoit un bonus pour kills et assists
    // Bonus = 0.5*K + 0.25*A
    roleAdjustment = 0.5 * kills + 0.25 * assists
  } else {
    // Carry reçoit un malus pour deaths
    // Malus = -0.5*D
    roleAdjustment = -0.5 * deaths
  }

  // Score final
  const final = base + roleAdjustment

  return {
    base,
    roleAdjustment,
    final,
  }
}
