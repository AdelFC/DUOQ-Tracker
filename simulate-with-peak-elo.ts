/**
 * Simulation de 50 parties avec le VRAI scoring engine
 * + Multiplicateur Peak Elo Hybride
 */

import { calculateGameScore } from './src/services/scoring/engine.js'
import { rankToValue, parseRankString, valueToRank, formatRankString } from './src/services/scoring/rank-utils.js'
import type { RankInfo } from './src/types/player.js'
import type { GameData } from './src/types/game.js'

// ========================================
// Multiplicateur Peak Elo (Hybride Douce - malus divisés par 2)
// ========================================
function calculatePeakEloMultiplier(peakElo: string, currentRank: RankInfo): number {
  const peakValue = rankToValue(parseRankString(peakElo))
  const currentValue = rankToValue(currentRank)

  const tierDiff = Math.floor((peakValue - currentValue) / 4)

  if (tierDiff <= 1) return 1.0
  if (tierDiff === 2) return 0.95  // -5% (était -10%)
  if (tierDiff === 3) return 0.875 // -12.5% (était -25%)
  if (tierDiff === 4) return 0.80  // -20% (était -40%)
  if (tierDiff >= 5) return 0.75   // -25% (était -50%)

  return 1.0
}

// ========================================
// Configuration des duos
// ========================================
interface DuoConfig {
  name: string
  carry: { peakElo: string; realSkill: number; name: string }
  noob: { peakElo: string; realSkill: number; name: string }
}

const DUOS: DuoConfig[] = [
  {
    name: 'Duo1',
    carry: { peakElo: 'D4', realSkill: 95, name: 'DiamondCarry' },
    noob: { peakElo: 'B4', realSkill: 30, name: 'BronzeNoob' },
  },
  {
    name: 'Duo2',
    carry: { peakElo: 'E4', realSkill: 85, name: 'EmeraldCarry' },
    noob: { peakElo: 'S4', realSkill: 45, name: 'SilverNoob' },
  },
  {
    name: 'Duo3',
    carry: { peakElo: 'P4', realSkill: 75, name: 'PlatCarry' },
    noob: { peakElo: 'G4', realSkill: 60, name: 'GoldNoob' },
  },
]

// ========================================
// État des joueurs
// ========================================
interface PlayerState {
  rank: RankInfo
  lp: number
  totalPoints: number
  realSkillLevel: number
  peakElo: string
  streak: number // Positif = winstreak, négatif = losestreak
}

interface DuoState {
  config: DuoConfig
  carry: PlayerState
  noob: PlayerState
  wins: number
  losses: number
}

// ========================================
// Simulation des KDA (RÉALISTE)
// ========================================
function simulateKDA(
  skillLevel: number,
  win: boolean,
  role: 'carry' | 'noob'
): { kills: number; deaths: number; assists: number } {
  // KDA basé sur skill (limité à max 20 kills, min 2 deaths)
  const baseKills = Math.max(0, Math.round((skillLevel / 10) * 1.2 + Math.random() * 6 - 1))
  const baseDeaths = Math.max(2, Math.round((100 - skillLevel) / 20 + Math.random() * 3))
  const baseAssists = Math.max(0, Math.round((skillLevel / 8) + Math.random() * 8 - 1))

  // Modifier selon win/loss
  let kills = win ? Math.min(20, Math.round(baseKills * 1.2)) : Math.max(0, Math.round(baseKills * 0.6))
  let deaths = win ? Math.max(1, Math.round(baseDeaths * 0.6)) : Math.min(12, Math.round(baseDeaths * 1.4))
  let assists = win ? Math.round(baseAssists * 1.3) : Math.max(0, Math.round(baseAssists * 0.7))

  // Carry smurfe plus (bonus kills, moins deaths)
  if (role === 'carry') {
    kills = Math.min(20, Math.round(kills * 1.15))
    deaths = Math.max(1, Math.round(deaths * 0.85))
  }

  // Choke occasionnel (5%)
  if (Math.random() < 0.05) {
    kills = Math.max(0, Math.round(kills * 0.4))
    deaths = Math.min(12, Math.round(deaths * 2.0))
    assists = Math.max(0, Math.round(assists * 0.5))
  }

  // Pop-off occasionnel (5%)
  if (Math.random() < 0.05 && win) {
    kills = Math.min(20, Math.round(kills * 1.6))
    deaths = Math.max(0, Math.round(deaths * 0.4))
    assists = Math.round(assists * 1.4)
  }

  return {
    kills: Math.min(20, kills),
    deaths: Math.max(0, Math.min(12, deaths)),
    assists: Math.min(25, assists),
  }
}

// ========================================
// Déterminer victoire/défaite
// ========================================
function determineWin(carrySkill: number, noobSkill: number): boolean {
  const carryWeight = 0.65
  const effectiveSkill = carrySkill * carryWeight + noobSkill * (1 - carryWeight)
  const winChance = effectiveSkill / 100
  return Math.random() < winChance
}

// ========================================
// Update LP et rank
// ========================================
function updateLP(
  state: PlayerState,
  win: boolean
): { lpGain: number; previousRank: RankInfo; promoted: boolean; demoted: boolean } {
  const previousRank = { ...state.rank, lp: state.lp }

  const baseLPGain = 28
  const baseLPLoss = 20
  const variance = Math.round(Math.random() * 6 - 3)

  const lpChange = win ? baseLPGain + variance : -(baseLPLoss + variance)
  state.lp += lpChange

  let promoted = false
  let demoted = false

  // Promotion
  if (state.lp >= 100) {
    state.lp -= 100
    const currentValue = rankToValue(state.rank)
    state.rank = valueToRank(currentValue + 1)
    promoted = true
  }

  // Demotion
  if (state.lp < 0) {
    const currentValue = rankToValue(state.rank)
    if (currentValue > 4) {
      state.rank = valueToRank(currentValue - 1)
      state.lp = 75
      demoted = true
    } else {
      state.lp = 0
    }
  }

  return { lpGain: lpChange, previousRank, promoted, demoted }
}

// ========================================
// Initialisation
// ========================================
function initializeDuos(): DuoState[] {
  return DUOS.map((config) => ({
    config,
    carry: {
      rank: { tier: 'BRONZE', division: 'IV', lp: 0 },
      lp: 0,
      totalPoints: 0,
      realSkillLevel: config.carry.realSkill,
      peakElo: config.carry.peakElo,
      streak: 0,
    },
    noob: {
      rank: { tier: 'BRONZE', division: 'IV', lp: 0 },
      lp: 0,
      totalPoints: 0,
      realSkillLevel: config.noob.realSkill,
      peakElo: config.noob.peakElo,
      streak: 0,
    },
    wins: 0,
    losses: 0,
  }))
}

// ========================================
// Simulation d'une game
// ========================================
function simulateGame(gameNum: number, duos: DuoState[]): string {
  const rows: string[] = []

  for (const duo of duos) {
    // Déterminer win/loss
    const win = determineWin(duo.carry.realSkillLevel, duo.noob.realSkillLevel)

    // Simuler KDA
    const carryKDA = simulateKDA(duo.carry.realSkillLevel, win, 'carry')
    const noobKDA = simulateKDA(duo.noob.realSkillLevel, win, 'noob')

    // Update streaks
    if (win) {
      duo.carry.streak = duo.carry.streak >= 0 ? duo.carry.streak + 1 : 1
      duo.noob.streak = duo.noob.streak >= 0 ? duo.noob.streak + 1 : 1
      duo.wins++
    } else {
      duo.carry.streak = duo.carry.streak <= 0 ? duo.carry.streak - 1 : -1
      duo.noob.streak = duo.noob.streak <= 0 ? duo.noob.streak - 1 : -1
      duo.losses++
    }

    // Update LP et rank
    const carryPrevRank = { ...duo.carry.rank, lp: duo.carry.lp }
    const noobPrevRank = { ...duo.noob.rank, lp: duo.noob.lp }

    const carryLP = updateLP(duo.carry, win)
    const noobLP = updateLP(duo.noob, win)

    // Créer GameData pour le scoring engine
    const gameData: GameData = {
      noobStats: {
        kills: noobKDA.kills,
        deaths: noobKDA.deaths,
        assists: noobKDA.assists,
        previousRank: noobPrevRank,
        newRank: duo.noob.rank,
        isOffRole: Math.random() < 0.15, // 15% off-role
        isOffChampion: Math.random() < 0.20, // 20% off-champion
      },
      carryStats: {
        kills: carryKDA.kills,
        deaths: carryKDA.deaths,
        assists: carryKDA.assists,
        previousRank: carryPrevRank,
        newRank: duo.carry.rank,
        isOffRole: Math.random() < 0.10, // 10% off-role
        isOffChampion: Math.random() < 0.15, // 15% off-champion
      },
      win,
      duration: win ? 1500 + Math.random() * 600 : 1800 + Math.random() * 400, // 25-35min
      surrender: !win && Math.random() < 0.2, // 20% surrender si loss
      remake: false,
    }

    // Calculer les points avec le VRAI scoring engine
    const scoreBreakdown = calculateGameScore({
      gameData,
      noobStreak: duo.noob.streak - (win ? 1 : -1), // Streak AVANT cette game
      carryStreak: duo.carry.streak - (win ? 1 : -1),
    })

    // Appliquer les multiplicateurs peak elo
    const carryPeakMultiplier = calculatePeakEloMultiplier(duo.carry.peakElo, duo.carry.rank)
    const noobPeakMultiplier = calculatePeakEloMultiplier(duo.noob.peakElo, duo.noob.rank)

    const carryPointsWithPeakMultiplier = Math.round(scoreBreakdown.carry.final * carryPeakMultiplier)
    const noobPointsWithPeakMultiplier = Math.round(scoreBreakdown.noob.final * noobPeakMultiplier)

    // Recalculer le total duo avec les nouveaux multiplicateurs
    const duoSumWithPeak = carryPointsWithPeakMultiplier + noobPointsWithPeakMultiplier
    const duoTotalWithPeak = Math.min(
      100,
      Math.max(-50, duoSumWithPeak + scoreBreakdown.duo.riskBonus.final + scoreBreakdown.duo.noDeathBonus)
    )

    duo.carry.totalPoints += carryPointsWithPeakMultiplier
    duo.noob.totalPoints += noobPointsWithPeakMultiplier

    const duoTotalPoints = duo.carry.totalPoints + duo.noob.totalPoints

    // Format output
    const result = win ? 'W' : 'L'
    const carryRankStr = formatRankString(duo.carry.rank)
    const noobRankStr = formatRankString(duo.noob.rank)

    rows.push(
      [
        gameNum,
        result,
        duoTotalPoints,
        `${carryKDA.kills}/${carryKDA.deaths}/${carryKDA.assists}`,
        carryPointsWithPeakMultiplier,
        `${carryRankStr} ${duo.carry.lp}LP (x${carryPeakMultiplier.toFixed(2)})`,
        `${noobKDA.kills}/${noobKDA.deaths}/${noobKDA.assists}`,
        noobPointsWithPeakMultiplier,
        `${noobRankStr} ${duo.noob.lp}LP (x${noobPeakMultiplier.toFixed(2)})`,
      ].join(',')
    )
  }

  return rows.join(',')
}

// ========================================
// Main
// ========================================
function runSimulation() {
  const duos = initializeDuos()

  // CSV header
  const header = [
    'Match',
    'Duo1_W/L',
    'Duo1_Points',
    'Duo1_Carry_KDA',
    'Duo1_Carry_Pts',
    'Duo1_Carry_Elo',
    'Duo1_Noob_KDA',
    'Duo1_Noob_Pts',
    'Duo1_Noob_Elo',
    'Duo2_W/L',
    'Duo2_Points',
    'Duo2_Carry_KDA',
    'Duo2_Carry_Pts',
    'Duo2_Carry_Elo',
    'Duo2_Noob_KDA',
    'Duo2_Noob_Pts',
    'Duo2_Noob_Elo',
    'Duo3_W/L',
    'Duo3_Points',
    'Duo3_Carry_KDA',
    'Duo3_Carry_Pts',
    'Duo3_Carry_Elo',
    'Duo3_Noob_KDA',
    'Duo3_Noob_Pts',
    'Duo3_Noob_Elo',
  ].join(',')

  console.log(header)

  // Simulate 50 games
  for (let i = 1; i <= 50; i++) {
    const row = simulateGame(i, duos)
    console.log(row)
  }

  // Print summary
  console.error('\n=== SUMMARY WITH PEAK ELO MULTIPLIER (HYBRID) ===')
  for (const duo of duos) {
    const winrate = ((duo.wins / (duo.wins + duo.losses)) * 100).toFixed(1)
    const carryPeakMult = calculatePeakEloMultiplier(duo.carry.peakElo, duo.carry.rank)
    const noobPeakMult = calculatePeakEloMultiplier(duo.noob.peakElo, duo.noob.rank)

    console.error(
      `${duo.config.name}: ${duo.wins}W/${duo.losses}L (${winrate}%) - ` +
        `Carry: ${formatRankString(duo.carry.rank)} ${duo.carry.lp}LP (peak ${duo.carry.peakElo}, mult x${carryPeakMult.toFixed(2)}) - ` +
        `Noob: ${formatRankString(duo.noob.rank)} ${duo.noob.lp}LP (peak ${duo.noob.peakElo}, mult x${noobPeakMult.toFixed(2)}) - ` +
        `Total: ${duo.carry.totalPoints + duo.noob.totalPoints} pts`
    )
  }
}

runSimulation()
