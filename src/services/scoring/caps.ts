/**
 * Plafonds (caps) pour éviter les exploits
 * Formules (v3.0 - Refonte scoring):
 *
 * Par joueur / game:
 * - Minimum: -40 points
 * - Maximum: +60 points
 *
 * Par duo / game:
 * - Minimum: -70 points
 * - Maximum: +120 points
 */

const PLAYER_MIN = -40
const PLAYER_MAX = 60

const DUO_MIN = -70
const DUO_MAX = 120

/**
 * Applique le plafond individuel à un score de joueur
 * @param score - Score du joueur (avant arrondi)
 * @returns Score cappé entre -40 et +60
 */
export function applyPlayerCap(score: number): number {
  return Math.max(PLAYER_MIN, Math.min(PLAYER_MAX, score))
}

/**
 * Applique le plafond de duo au score total
 * @param score - Score du duo (somme des joueurs + bonus duo)
 * @returns Score cappé entre -70 et +120
 */
export function applyDuoCap(score: number): number {
  return Math.max(DUO_MIN, Math.min(DUO_MAX, score))
}
