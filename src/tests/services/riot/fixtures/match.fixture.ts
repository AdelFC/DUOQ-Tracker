/**
 * Match API Fixtures
 * Mock responses for Riot Match-v5 API
 */

import { MatchData, MatchParticipant } from '../../../../services/riot/types'

/**
 * Mock match IDs for a player
 */
export const MOCK_MATCH_IDS = [
  'EUW1_1234567890',
  'EUW1_1234567891',
  'EUW1_1234567892',
  'EUW1_1234567893',
  'EUW1_1234567894',
]

/**
 * Create a mock participant for testing
 */
export function createMockParticipant(
  overrides: Partial<MatchParticipant> = {}
): MatchParticipant {
  return {
    puuid: 'mock-puuid-1234567890',
    summonerId: 'mock-summoner-id',
    summonerName: 'TestPlayer',
    teamId: 100, // Blue team
    championName: 'Jinx',
    championId: 222,
    kills: 10,
    deaths: 2,
    assists: 8,
    totalDamageDealtToChampions: 25000,
    goldEarned: 15000,
    visionScore: 40,
    champLevel: 18,
    teamPosition: 'BOTTOM',
    role: 'CARRY',
    lane: 'BOTTOM',
    item0: 3031,
    item1: 3094,
    item2: 3006,
    item3: 3072,
    item4: 3036,
    item5: 3046,
    item6: 3340,
    summoner1Id: 4,
    summoner2Id: 7,
    timePlayed: 1800,
    win: true,
    ...overrides,
  }
}

/**
 * Create a mock match data for testing
 */
export function createMockMatch(overrides: Partial<MatchData> = {}): MatchData {
  const now = Date.now()
  const oneHourAgo = now - 60 * 60 * 1000

  const participant1 = createMockParticipant({
    puuid: 'puuid-player1',
    summonerId: 'summoner-player1',
    teamId: 100,
    win: true,
  })

  const participant2 = createMockParticipant({
    puuid: 'puuid-player2',
    summonerId: 'summoner-player2',
    teamId: 100, // Same team
    championName: 'Thresh',
    championId: 412,
    kills: 2,
    deaths: 4,
    assists: 18,
    win: true,
  })

  // Add 8 more players to complete the teams
  const bluePlayers = [
    participant1,
    participant2,
    createMockParticipant({ puuid: 'puuid-blue3', teamId: 100, win: true }),
    createMockParticipant({ puuid: 'puuid-blue4', teamId: 100, win: true }),
    createMockParticipant({ puuid: 'puuid-blue5', teamId: 100, win: true }),
  ]

  const redPlayers = [
    createMockParticipant({ puuid: 'puuid-red1', teamId: 200, win: false }),
    createMockParticipant({ puuid: 'puuid-red2', teamId: 200, win: false }),
    createMockParticipant({ puuid: 'puuid-red3', teamId: 200, win: false }),
    createMockParticipant({ puuid: 'puuid-red4', teamId: 200, win: false }),
    createMockParticipant({ puuid: 'puuid-red5', teamId: 200, win: false }),
  ]

  return {
    metadata: {
      dataVersion: '2',
      matchId: 'EUW1_1234567890',
      participants: [...bluePlayers, ...redPlayers].map((p) => p.puuid),
    },
    info: {
      gameCreation: oneHourAgo - 30 * 60 * 1000, // Started 1.5 hours ago
      gameDuration: 1800, // 30 minutes
      gameEndTimestamp: oneHourAgo, // Ended 1 hour ago
      gameId: 1234567890,
      gameMode: 'CLASSIC',
      gameName: 'teambuilder-match-1234567890',
      gameStartTimestamp: oneHourAgo - 30 * 60 * 1000,
      gameType: 'MATCHED_GAME',
      gameVersion: '14.1.1',
      mapId: 11, // Summoner's Rift
      platformId: 'EUW1',
      queueId: 420, // Solo/Duo Ranked
      tournamentCode: '',
      participants: [...bluePlayers, ...redPlayers],
      teams: [
        {
          teamId: 100,
          win: true,
          bans: [],
          objectives: {
            baron: { first: true, kills: 1 },
            champion: { first: true, kills: 25 },
            dragon: { first: true, kills: 3 },
            inhibitor: { first: true, kills: 1 },
            riftHerald: { first: true, kills: 1 },
            tower: { first: true, kills: 8 },
          },
        },
        {
          teamId: 200,
          win: false,
          bans: [],
          objectives: {
            baron: { first: false, kills: 0 },
            champion: { first: false, kills: 10 },
            dragon: { first: false, kills: 1 },
            inhibitor: { first: false, kills: 0 },
            riftHerald: { first: false, kills: 0 },
            tower: { first: false, kills: 2 },
          },
        },
      ],
    },
    ...overrides,
  }
}

/**
 * Create a mock remake match (< 5 minutes)
 */
export function createMockRemake(): MatchData {
  return createMockMatch({
    info: {
      ...createMockMatch().info,
      gameDuration: 240, // 4 minutes
    },
  })
}

/**
 * Create a mock old match (> 4 hours)
 */
export function createMockOldMatch(): MatchData {
  const fiveHoursAgo = Date.now() - 5 * 60 * 60 * 1000
  return createMockMatch({
    info: {
      ...createMockMatch().info,
      gameEndTimestamp: fiveHoursAgo,
    },
  })
}

/**
 * Create a match where two players are in DIFFERENT teams (soloQ scenario)
 */
export function createMockSoloQMatch(): MatchData {
  const match = createMockMatch()
  // Move participant2 to red team
  match.info.participants[1].teamId = 200
  match.info.participants[1].win = false
  return match
}
