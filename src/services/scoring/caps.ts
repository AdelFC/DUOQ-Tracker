/**
 * Plafonds (caps) pour éviter les exploits
 * Formules (SPECIFICATIONS.md v2.1 - Section 7):
 *
 * Par joueur / game:
 * - Minimum: -25 points
 * - Maximum: +70 points
 *
 * Par duo / game:
 * - Minimum: -50 points
 * - Maximum: +120 points
 */

const PLAYER_MIN = -25
const PLAYER_MAX = 70

const DUO_MIN = -50
const DUO_MAX = 120

/**
 * Applique le plafond individuel à un score de joueur
 * @param score - Score du joueur (avant arrondi)
 * @returns Score cappé entre -25 et +70
 */
export function applyPlayerCap(score: number): number {
  return Math.max(PLAYER_MIN, Math.min(PLAYER_MAX, score))
}

/**
 * Applique le plafond de duo au score total
 * @param score - Score du duo (somme des joueurs + bonus duo)
 * @returns Score cappé entre -50 et +120
 */
export function applyDuoCap(score: number): number {
  return Math.max(DUO_MIN, Math.min(DUO_MAX, score))
}
