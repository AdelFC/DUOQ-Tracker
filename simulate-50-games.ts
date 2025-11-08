/**
 * Simulation de 50 parties pour 3 duos de niveaux différents
 * Tous partent de Bronze 4 0 LP
 * Moyenne: +28 LP en victoire, -20 LP en défaite
 */

import type { RankInfo } from './src/types/player.js'
import { rankToValue, valueToRank, formatRankString } from './src/services/scoring/rank-utils.js'
import { calculatePlayerRankMultiplier } from './src/services/scoring/rank-multiplier.js'

// Duos configuration
interface DuoConfig {
  name: string
  carry: { realElo: string; name: string }
  noob: { realElo: string; name: string }
}

const DUOS: DuoConfig[] = [
  {
    name: 'Duo1',
    carry: { realElo: 'D4', name: 'DiamondCarry' },
    noob: { realElo: 'B4', name: 'BronzeNoob' },
  },
  {
    name: 'Duo2',
    carry: { realElo: 'E4', name: 'EmeraldCarry' },
    noob: { realElo: 'S4', name: 'SilverNoob' },
  },
  {
    name: 'Duo3',
    carry: { realElo: 'P4', name: 'PlatCarry' },
    noob: { realElo: 'G4', name: 'GoldNoob' },
  },
]

interface PlayerState {
  rank: RankInfo
  lp: number
  totalPoints: number
  realSkillLevel: number // 0-100 pour simulation KDA
}

interface DuoState {
  config: DuoConfig
  carry: PlayerState
  noob: PlayerState
  wins: number
  losses: number
}

// Parse rank string (ex: "D4" → DIAMOND IV)
function parseRank(rankStr: string): RankInfo {
  const tierMap: Record<string, string> = {
    B: 'BRONZE',
    S: 'SILVER',
    G: 'GOLD',
    P: 'PLATINUM',
    E: 'EMERALD',
    D: 'DIAMOND',
  }

  const tier = tierMap[rankStr[0]] as any
  const division = rankStr[1] === '4' ? 'IV' : rankStr[1] === '3' ? 'III' : rankStr[1] === '2' ? 'II' : 'I'

  return { tier, division, lp: 0 }
}

// Skill level based on real elo
function getSkillLevel(realElo: string): number {
  const map: Record<string, number> = {
    B4: 30,
    S4: 45,
    G4: 60,
    P4: 75,
    E4: 85,
    D4: 95,
  }
  return map[realElo] || 50
}

// Simulate KDA based on skill and randomness
function simulateKDA(skillLevel: number, win: boolean): { kills: number; deaths: number; assists: number; kda: string } {
  // Le skill level influence les stats de base
  const baseKills = Math.max(0, Math.round((skillLevel / 10) + (Math.random() * 8) - 2))
  const baseDeaths = Math.max(0, Math.round((100 - skillLevel) / 15 + Math.random() * 4))
  const baseAssists = Math.max(0, Math.round((skillLevel / 8) + (Math.random() * 10) - 2))

  // Modifier selon win/loss
  const kills = win ? Math.round(baseKills * 1.3) : Math.max(0, Math.round(baseKills * 0.7))
  const deaths = win ? Math.max(1, Math.round(baseDeaths * 0.7)) : Math.round(baseDeaths * 1.3)
  const assists = win ? Math.round(baseAssists * 1.2) : Math.max(0, Math.round(baseAssists * 0.8))

  // Parfois le joueur choke ou pop off (10% chance)
  const choke = Math.random() < 0.1
  const popOff = Math.random() < 0.1

  let finalKills = kills
  let finalDeaths = deaths
  let finalAssists = assists

  if (choke) {
    finalKills = Math.max(0, Math.round(kills * 0.5))
    finalDeaths = Math.round(deaths * 1.8)
    finalAssists = Math.max(0, Math.round(assists * 0.6))
  } else if (popOff) {
    finalKills = Math.round(kills * 1.8)
    finalDeaths = Math.max(1, Math.round(deaths * 0.5))
    finalAssists = Math.round(assists * 1.5)
  }

  const kdaValue = finalDeaths === 0 ? (finalKills + finalAssists) : (finalKills + finalAssists) / finalDeaths

  return {
    kills: finalKills,
    deaths: finalDeaths,
    assists: finalAssists,
    kda: kdaValue.toFixed(2),
  }
}

// Determine win based on skill levels
function determineWin(carrySkill: number, noobSkill: number): boolean {
  // Plus le carry est fort, plus le winrate est élevé
  const avgSkill = (carrySkill + noobSkill) / 2
  const carryWeight = 0.7 // Le carry a 70% d'influence sur le résultat
  const effectiveSkill = carrySkill * carryWeight + noobSkill * (1 - carryWeight)

  // Winrate basé sur le skill effectif
  // Skill 95 (Diamond) → ~75% winrate en Bronze
  // Skill 85 (Emerald) → ~65% winrate en Bronze
  // Skill 75 (Plat) → ~55% winrate en Bronze

  const winChance = effectiveSkill / 100
  return Math.random() < winChance
}

// Update LP and rank
function updateLP(state: PlayerState, win: boolean): { lpGain: number; previousRank: RankInfo } {
  const previousRank = { ...state.rank, lp: state.lp }

  // LP gains/losses avec variance
  const baseLPGain = 28
  const baseLPLoss = 20
  const variance = Math.round((Math.random() * 6) - 3) // ±3 LP

  const lpChange = win ? baseLPGain + variance : -(baseLPLoss + variance)

  state.lp += lpChange

  // Promotion
  if (state.lp >= 100) {
    state.lp -= 100
    const currentValue = rankToValue(state.rank)
    state.rank = valueToRank(currentValue + 1)
  }

  // Demotion
  if (state.lp < 0) {
    const currentValue = rankToValue(state.rank)
    if (currentValue > 4) {
      // Can go below Bronze 4 (value 4)
      state.rank = valueToRank(currentValue - 1)
      state.lp = 75 // Démarre à 75 LP après demotion
    } else {
      state.lp = 0 // Can't go below Bronze 4 0 LP
    }
  }

  return { lpGain: lpChange, previousRank }
}

// Initialize duos
function initializeDuos(): DuoState[] {
  return DUOS.map((config) => ({
    config,
    carry: {
      rank: { tier: 'BRONZE', division: 'IV', lp: 0 },
      lp: 0,
      totalPoints: 0,
      realSkillLevel: getSkillLevel(config.carry.realElo),
    },
    noob: {
      rank: { tier: 'BRONZE', division: 'IV', lp: 0 },
      lp: 0,
      totalPoints: 0,
      realSkillLevel: getSkillLevel(config.noob.realElo),
    },
    wins: 0,
    losses: 0,
  }))
}

// Simulate one game for all duos
function simulateGame(gameNum: number, duos: DuoState[]): string {
  const rows: string[] = []

  for (const duo of duos) {
    // Determine win/loss
    const win = determineWin(duo.carry.realSkillLevel, duo.noob.realSkillLevel)

    // Update win/loss count
    if (win) {
      duo.wins++
    } else {
      duo.losses++
    }

    // Simulate KDAs
    const carryKDA = simulateKDA(duo.carry.realSkillLevel, win)
    const noobKDA = simulateKDA(duo.noob.realSkillLevel, win)

    // Update LP and ranks
    const carryPrevRank = { ...duo.carry.rank, lp: duo.carry.lp }
    const noobPrevRank = { ...duo.noob.rank, lp: duo.noob.lp }

    const carryLP = updateLP(duo.carry, win)
    const noobLP = updateLP(duo.noob, win)

    // Calculate multipliers
    const carryMultiplier = calculatePlayerRankMultiplier(duo.carry.rank, duo.noob.rank)
    const noobMultiplier = calculatePlayerRankMultiplier(duo.noob.rank, duo.carry.rank)

    // Simple point calculation (base points from win/loss + KDA bonus)
    const basePoints = win ? 20 : -15
    const carryKDAPoints = Math.round(parseFloat(carryKDA.kda) * 5)
    const noobKDAPoints = Math.round(parseFloat(noobKDA.kda) * 5)

    const carryPoints = Math.round((basePoints + carryKDAPoints) * carryMultiplier)
    const noobPoints = Math.round((basePoints + noobKDAPoints) * noobMultiplier)

    duo.carry.totalPoints += carryPoints
    duo.noob.totalPoints += noobPoints

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
        carryPoints,
        `${carryRankStr} ${duo.carry.lp}LP (x${carryMultiplier.toFixed(2)})`,
        `${noobKDA.kills}/${noobKDA.deaths}/${noobKDA.assists}`,
        noobPoints,
        `${noobRankStr} ${duo.noob.lp}LP (x${noobMultiplier.toFixed(2)})`,
      ].join(',')
    )
  }

  return rows.join(',')
}

// Main simulation
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
  console.error('\n=== SUMMARY ===')
  for (const duo of duos) {
    const winrate = ((duo.wins / (duo.wins + duo.losses)) * 100).toFixed(1)
    console.error(
      `${duo.config.name}: ${duo.wins}W/${duo.losses}L (${winrate}%) - Carry: ${formatRankString(duo.carry.rank)} ${duo.carry.lp}LP - Noob: ${formatRankString(duo.noob.rank)} ${duo.noob.lp}LP - Total: ${duo.carry.totalPoints + duo.noob.totalPoints} pts`
    )
  }
}

runSimulation()
