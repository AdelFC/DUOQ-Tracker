/**
 * Utilitaires pour la manipulation des ranks
 * Conversion rank <-> valeur numérique pour calculs
 */

import type { RankInfo } from '../../types/player.js'

// Ordre des tiers (valeur de base par tier)
const TIER_VALUES: Record<string, number> = {
  IRON: 0,
  BRONZE: 4,
  SILVER: 8,
  GOLD: 12,
  PLATINUM: 16,
  EMERALD: 20,
  DIAMOND: 24,
  MASTER: 28,
  GRANDMASTER: 32,
  CHALLENGER: 36,
}

// Ordre des divisions (valeur ajoutée)
const DIVISION_VALUES: Record<string, number> = {
  IV: 0,
  III: 1,
  II: 2,
  I: 3,
}

/**
 * Convertit un RankInfo en valeur numérique
 * Ex: GOLD IV = 12, GOLD III = 13, GOLD II = 14, GOLD I = 15
 * Ex: MASTER (no division) = 28
 * @param rank - RankInfo à convertir
 * @returns Valeur numérique (0-40)
 */
export function rankToValue(rank: RankInfo): number {
  const tierValue = TIER_VALUES[rank.tier]

  if (rank.division === null) {
    // Master+ : pas de division
    return tierValue
  }

  const divisionValue = DIVISION_VALUES[rank.division]
  return tierValue + divisionValue
}

/**
 * Convertit une valeur numérique en RankInfo
 * @param value - Valeur numérique
 * @returns RankInfo correspondant
 */
export function valueToRank(value: number): RankInfo {
  // Clamp entre 0 et 36
  value = Math.max(0, Math.min(36, value))

  // Trouver le tier
  const tiers = Object.entries(TIER_VALUES).sort((a, b) => b[1] - a[1])

  for (const [tier, tierValue] of tiers) {
    if (value >= tierValue) {
      // Master+ : pas de division
      if (tierValue >= 28) {
        return {
          tier: tier as any,
          division: null,
          lp: 0,
        }
      }

      // Calculer la division
      const divisionValue = value - tierValue
      const divisions: Array<[string, number]> = Object.entries(DIVISION_VALUES)
      const division = divisions.find(([_, val]) => val === divisionValue)?.[0] || 'IV'

      return {
        tier: tier as any,
        division: division as any,
        lp: 0,
      }
    }
  }

  // Fallback : IRON IV
  return {
    tier: 'IRON',
    division: 'IV',
    lp: 0,
  }
}

/**
 * Parse un rank string format "G2", "P4", "D1", etc.
 * @param rankStr - String format (ex: "G2", "P4", "M", "GM")
 * @returns RankInfo
 */
export function parseRankString(rankStr: string): RankInfo {
  const tierMap: Record<string, string> = {
    I: 'IRON',
    B: 'BRONZE',
    S: 'SILVER',
    G: 'GOLD',
    P: 'PLATINUM',
    E: 'EMERALD',
    D: 'DIAMOND',
    M: 'MASTER',
    GM: 'GRANDMASTER',
    C: 'CHALLENGER',
  }

  // Extraire tier et division
  const tierLetter = rankStr.match(/^[A-Z]+/)?.[0] || 'G'
  const divisionNum = rankStr.match(/\d+$/)?.[0]

  const tier = tierMap[tierLetter] || 'GOLD'

  if (!divisionNum || tier === 'MASTER' || tier === 'GRANDMASTER' || tier === 'CHALLENGER') {
    return {
      tier: tier as any,
      division: null,
      lp: 0,
    }
  }

  const divisionMap: Record<string, string> = {
    '4': 'IV',
    '3': 'III',
    '2': 'II',
    '1': 'I',
  }

  return {
    tier: tier as any,
    division: (divisionMap[divisionNum] as any) || 'IV',
    lp: 0,
  }
}

/**
 * Formatte un RankInfo en string format "G2"
 * @param rank - RankInfo à formater
 * @returns String format
 */
export function formatRankString(rank: RankInfo): string {
  const tierMap: Record<string, string> = {
    IRON: 'I',
    BRONZE: 'B',
    SILVER: 'S',
    GOLD: 'G',
    PLATINUM: 'P',
    EMERALD: 'E',
    DIAMOND: 'D',
    MASTER: 'M',
    GRANDMASTER: 'GM',
    CHALLENGER: 'C',
  }

  const tier = tierMap[rank.tier]

  if (rank.division === null) {
    return tier
  }

  const divisionMap: Record<string, string> = {
    IV: '4',
    III: '3',
    II: '2',
    I: '1',
  }

  const division = divisionMap[rank.division]

  return `${tier}${division}`
}
