/**
 * Tests for GameDetector
 *
 * Tests game detection logic (ongoing, completed, remakes)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameDetector } from '../../../services/game-tracker/detector'
import { RiotService } from '../../../services/riot'
import { DuoTracking } from '../../../services/game-tracker/types'
import { createMockMatch, createMockRemake } from '../../services/riot/fixtures/match.fixture'

describe('GameDetector', () => {
  let detector: GameDetector
  let mockRiotService: RiotService

  const mockTracking: DuoTracking = {
    duoId: 'duo-1',
    state: 'idle',
    noobPuuid: 'puuid-noob',
    carryPuuid: 'puuid-carry',
    noobUserId: 'user-noob',
    carryUserId: 'user-carry',
    lastCheckedAt: 0,
    fetchAttempts: 0,
    maxFetchAttempts: 18,
  }

  beforeEach(() => {
    mockRiotService = {
      getMatchIds: vi.fn(),
      getMatch: vi.fn(),
      findCommonMatch: vi.fn(),
      isMatchRecent: vi.fn(),
      isRemake: vi.fn(),
    } as any

    detector = new GameDetector(mockRiotService)
  })

  // ============================================================================
  // isInGame
  // ============================================================================

  it('devrait retourner null si aucun match récent', async () => {
    vi.mocked(mockRiotService.getMatchIds).mockResolvedValue([])

    const result = await detector.isInGame(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner null si les deux joueurs n\'ont pas le même dernier match', async () => {
    vi.mocked(mockRiotService.getMatchIds)
      .mockResolvedValueOnce(['EUW1_111']) // noob
      .mockResolvedValueOnce(['EUW1_222']) // carry (different)

    const result = await detector.isInGame(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner null si le match est déjà terminé', async () => {
    const recentMatch = createMockMatch()

    vi.mocked(mockRiotService.getMatchIds)
      .mockResolvedValueOnce(['EUW1_123'])
      .mockResolvedValueOnce(['EUW1_123']) // Same match
    vi.mocked(mockRiotService.getMatch).mockResolvedValue(recentMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(true) // Match already ended

    const result = await detector.isInGame(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner le match ID si le match est en cours', async () => {
    const ongoingMatch = createMockMatch()

    vi.mocked(mockRiotService.getMatchIds)
      .mockResolvedValueOnce(['EUW1_123'])
      .mockResolvedValueOnce(['EUW1_123'])
    vi.mocked(mockRiotService.getMatch).mockResolvedValue(ongoingMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(false) // Still ongoing

    const result = await detector.isInGame(mockTracking)

    expect(result).toBe('EUW1_123')
  })

  it('devrait retourner null en cas d\'erreur API', async () => {
    vi.mocked(mockRiotService.getMatchIds).mockRejectedValue(new Error('API Error'))

    const result = await detector.isInGame(mockTracking)

    expect(result).toBeNull()
  })

  // ============================================================================
  // findCompletedMatch
  // ============================================================================

  it('devrait retourner null si aucun match commun trouvé', async () => {
    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(null)

    const result = await detector.findCompletedMatch(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner null si le match est trop ancien (> 4h)', async () => {
    const oldMatch = createMockMatch()

    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(oldMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(false) // Too old

    const result = await detector.findCompletedMatch(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner null si le match est un remake', async () => {
    const remakeMatch = createMockRemake()

    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(remakeMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(true) // Recent
    vi.mocked(mockRiotService.isRemake).mockReturnValue(true) // Remake!

    const result = await detector.findCompletedMatch(mockTracking)

    expect(result).toBeNull()
  })

  it('devrait retourner le match data si trouvé, récent, et pas remake', async () => {
    const validMatch = createMockMatch()

    vi.mocked(mockRiotService.findCommonMatch).mockResolvedValue(validMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(true)
    vi.mocked(mockRiotService.isRemake).mockReturnValue(false)

    const result = await detector.findCompletedMatch(mockTracking)

    expect(result).toBe(validMatch)
  })

  it('devrait retourner null en cas d\'erreur lors de la recherche', async () => {
    vi.mocked(mockRiotService.findCommonMatch).mockRejectedValue(new Error('API Error'))

    const result = await detector.findCompletedMatch(mockTracking)

    expect(result).toBeNull()
  })

  // ============================================================================
  // hasMatchEnded
  // ============================================================================

  it('devrait retourner true si le match est terminé et récent', async () => {
    const endedMatch = createMockMatch()

    vi.mocked(mockRiotService.getMatch).mockResolvedValue(endedMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(true)

    const result = await detector.hasMatchEnded('EUW1_123')

    expect(result).toBe(true)
  })

  it('devrait retourner false si le match est encore en cours', async () => {
    const ongoingMatch = createMockMatch()

    vi.mocked(mockRiotService.getMatch).mockResolvedValue(ongoingMatch)
    vi.mocked(mockRiotService.isMatchRecent).mockReturnValue(false)

    const result = await detector.hasMatchEnded('EUW1_123')

    expect(result).toBe(false)
  })

  it('devrait retourner false en cas d\'erreur API (assume ongoing)', async () => {
    vi.mocked(mockRiotService.getMatch).mockRejectedValue(new Error('API Error'))

    const result = await detector.hasMatchEnded('EUW1_123')

    expect(result).toBe(false)
  })
})
