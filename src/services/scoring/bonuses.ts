/**
 * Bonus spéciaux
 * Formules (SPECIFICATIONS.md v2.1 - Section 6):
 *
 * Bonus Duo "No Death":
 * - Condition: Les 2 joueurs du duo ont 0 death
 * - Bonus: +20 points au duo
 *
 * NOTE: Les autres bonus (MVP, Pentakill) sont optionnels et pas implémentés pour v1
 */

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
