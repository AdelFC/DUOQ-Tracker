/**
 * Types pour l'API Riot Games
 * Documentation: https://developer.riotgames.com/apis
 *
 * APIs utilisées:
 * - Account-v1: Récupérer PUUID via gameName + tagLine
 * - Match-v5: Récupérer historique et détails de matchs
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export type RiotRegion = 'euw1' | 'eun1' | 'na1' | 'br1' | 'jp1' | 'kr' | 'la1' | 'la2' | 'oc1' | 'ru' | 'tr1'
export type RiotRouting = 'europe' | 'americas' | 'asia' | 'sea'

export const REGION_TO_ROUTING: Record<RiotRegion, RiotRouting> = {
  euw1: 'europe',
  eun1: 'europe',
  na1: 'americas',
  br1: 'americas',
  jp1: 'asia',
  kr: 'asia',
  la1: 'americas',
  la2: 'americas',
  oc1: 'sea',
  ru: 'europe',
  tr1: 'europe',
}

// ============================================================================
// ACCOUNT-V1 API
// https://developer.riotgames.com/apis#account-v1
// ============================================================================

export interface RiotAccount {
  puuid: string
  gameName: string
  tagLine: string
}

// ============================================================================
// MATCH-V5 API
// https://developer.riotgames.com/apis#match-v5
// ============================================================================

export interface MatchData {
  metadata: MatchMetadata
  info: MatchInfo
}

export interface MatchMetadata {
  dataVersion: string
  matchId: string
  participants: string[] // Array of PUUIDs
}

export interface MatchInfo {
  gameCreation: number // Unix epoch milliseconds
  gameDuration: number // Seconds
  gameEndTimestamp: number // Unix epoch milliseconds
  gameId: number
  gameMode: string // "CLASSIC" pour Summoner's Rift
  gameName: string
  gameStartTimestamp: number // Unix epoch milliseconds
  gameType: string // "MATCHED_GAME"
  gameVersion: string
  mapId: number // 11 pour Summoner's Rift
  participants: MatchParticipant[]
  platformId: string
  queueId: number // 420 pour Solo/Duo Ranked, 440 pour Flex
  teams: MatchTeam[]
  tournamentCode: string
}

export interface MatchParticipant {
  // Player identity
  puuid: string
  summonerId: string
  summonerName: string

  // Champion
  championId: number
  championName: string
  champLevel: number

  // Team & Position
  teamId: number // 100 (blue) ou 200 (red)
  teamPosition: string // "TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"
  role: string
  lane: string

  // Game result
  win: boolean

  // KDA
  kills: number
  deaths: number
  assists: number

  // Multikills (optionnels - ajoutés pour bonus spéciaux)
  pentaKills?: number
  quadraKills?: number
  tripleKills?: number
  doubleKills?: number
  firstBloodKill?: boolean
  largestKillingSpree?: number

  // Stats (pour détection MVP future)
  goldEarned: number
  totalDamageDealtToChampions: number
  visionScore: number

  // Items (pour détection build)
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number // Trinket

  // Summoner spells
  summoner1Id: number
  summoner2Id: number

  // Time
  timePlayed: number
}

export interface MatchTeam {
  teamId: number // 100 ou 200
  win: boolean
  bans: Ban[]
  objectives: Objectives
}

export interface Ban {
  championId: number
  pickTurn: number
}

export interface Objectives {
  baron: ObjectiveDetail
  champion: ObjectiveDetail
  dragon: ObjectiveDetail
  inhibitor: ObjectiveDetail
  riftHerald: ObjectiveDetail
  tower: ObjectiveDetail
}

export interface ObjectiveDetail {
  first: boolean
  kills: number
}

// ============================================================================
// API ERROR
// ============================================================================

export interface RiotApiError {
  status: {
    message: string
    status_code: number
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export interface RateLimitInfo {
  appRateLimitCount: number
  appRateLimit: number
  methodRateLimitCount: number
  methodRateLimit: number
  retryAfter?: number
}
