import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pollGamesHandler } from '../../../handlers/game/poll.handler.js'
import { message, state, player, duo } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { Response } from '../../../types/message.js'
import type { State } from '../../../types/state.js'

describe('Handler Game Poll', () => {
  let testState: State
  let responses: Response[]
  let mockRiotService: any

  beforeEach(() => {
    testState = state().build()
    responses = []

    // Create mock RiotApiService
    mockRiotService = {
      getRecentMatchIds: vi.fn().mockResolvedValue([]),
      getMatchDetails: vi.fn().mockResolvedValue(null),
    }

    // Add to state
    testState.riotService = mockRiotService
  })

  it('should handle no duos gracefully', async () => {
    const msg = message(MessageType.POLL).build()

    await pollGamesHandler(msg, testState, responses)

    // Should return info message about no duos
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.INFO)
    expect(responses[0].content).toContain('Aucun duo')
  })

  it('should skip duo with missing players', async () => {
    // Create duo without creating the players
    const testDuo = duo('user1', 'user2').withId(1).build()
    testState.duos.set(testDuo.id, testDuo)

    const msg = message(MessageType.POLL).build()

    await pollGamesHandler(msg, testState, responses)

    // Should complete with summary showing 0 games found
    expect(responses).toHaveLength(1)
    expect(responses[0].content).toContain('0 nouveau')
  })

  it('should skip duo with players missing PUUID', async () => {
    // Create players without PUUID
    const player1 = player('user1').withGameName('Player1', 'EUW').asNoob().build()
    const player2 = player('user2').withGameName('Player2', 'EUW').asCarry().build()

    // Remove PUUIDs
    player1.puuid = undefined
    player2.puuid = undefined

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)

    const testDuo = duo('user1', 'user2').withId(1).build()
    testState.duos.set(testDuo.id, testDuo)

    const msg = message(MessageType.POLL).build()

    await pollGamesHandler(msg, testState, responses)

    // Should complete with summary
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.INFO)
  })

  it('should poll matches for duo with PUUID', async () => {
    // Create players with PUUID
    const player1 = player('user1')
      .withGameName('Player1', 'EUW')
      .asNoob()
      .withPuuid('test-puuid-1')
      .build()
    const player2 = player('user2')
      .withGameName('Player2', 'EUW')
      .asCarry()
      .withPuuid('test-puuid-2')
      .build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)

    const testDuo = duo('user1', 'user2').withId(1).build()
    testState.duos.set(testDuo.id, testDuo)

    const msg = message(MessageType.POLL).build()

    await pollGamesHandler(msg, testState, responses)

    // Should have called getRecentMatchIds for both players
    expect(mockRiotService.getRecentMatchIds).toHaveBeenCalledWith('test-puuid-1', 5)
    expect(mockRiotService.getRecentMatchIds).toHaveBeenCalledWith('test-puuid-2', 5)

    // Should complete with summary
    expect(responses).toHaveLength(1)
    expect(responses[0].type).toBe(MessageType.INFO)
    expect(responses[0].content).toContain('Polling terminé')
  })

  it('should skip already tracked matches', async () => {
    const player1 = player('user1')
      .withGameName('Player1', 'EUW')
      .asNoob()
      .withPuuid('test-puuid-1')
      .build()
    const player2 = player('user2')
      .withGameName('Player2', 'EUW')
      .asCarry()
      .withPuuid('test-puuid-2')
      .build()

    testState.players.set(player1.discordId, player1)
    testState.players.set(player2.discordId, player2)

    const testDuo = duo('user1', 'user2').withId(1).build()
    testState.duos.set(testDuo.id, testDuo)

    // Add a match that's already tracked
    const matchId = 'EUW1_123456'
    testState.games.set(matchId, {
      id: matchId,
      duoId: testDuo.id,
      startTime: new Date(),
      endTime: new Date(),
      win: true,
      noobKDA: '10/3/15',
      carryKDA: '8/5/20',
      noobChampion: 'Jinx',
      carryChampion: 'Thresh',
      duration: 1800,
      scored: false,
    })

    // Mock to return the same match ID
    mockRiotService.getRecentMatchIds.mockResolvedValue([matchId])

    const msg = message(MessageType.POLL).build()

    await pollGamesHandler(msg, testState, responses)

    // Should NOT call getMatchDetails since match is already tracked
    expect(mockRiotService.getMatchDetails).not.toHaveBeenCalled()

    // Should show 1 already tracked
    expect(responses).toHaveLength(1)
    expect(responses[0].content).toContain('1 déjà tracké')
  })
})
