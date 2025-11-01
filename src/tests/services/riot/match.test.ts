/**
 * Tests for MatchService
 *
 * Tests Match-v5 API calls and duo validation logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MatchService } from '../../../services/riot/match'
import { RiotClient } from '../../../services/riot/client'
import {
  MOCK_MATCH_IDS,
  createMockMatch,
  createMockRemake,
  createMockOldMatch,
  createMockSoloQMatch,
} from './fixtures/match.fixture'

describe('MatchService', () => {
  let service: MatchService
  let mockClient: RiotClient

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
    } as any

    service = new MatchService(mockClient)
  })

  // ============================================================================
  // getMatchIdsByPuuid
  // ============================================================================

  it('devrait récupérer les IDs de match pour un PUUID', async () => {
    vi.mocked(mockClient.get).mockResolvedValue(MOCK_MATCH_IDS)

    const result = await service.getMatchIdsByPuuid('test-puuid')

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/test-puuid/ids?count=20'
    )
    expect(result).toEqual(MOCK_MATCH_IDS)
  })

  it('devrait utiliser le count fourni', async () => {
    vi.mocked(mockClient.get).mockResolvedValue([])

    await service.getMatchIdsByPuuid('test-puuid', 'euw1', 10)

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/test-puuid/ids?count=10'
    )
  })

  it('devrait filtrer par queue si fourni', async () => {
    vi.mocked(mockClient.get).mockResolvedValue([])

    await service.getMatchIdsByPuuid('test-puuid', 'euw1', 20, 420)

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/lol/match/v5/matches/by-puuid/test-puuid/ids?count=20&queue=420'
    )
  })

  it('devrait lancer une erreur si PUUID est vide', async () => {
    await expect(service.getMatchIdsByPuuid('')).rejects.toThrow('PUUID is required')
  })

  // ============================================================================
  // getMatchById
  // ============================================================================

  it('devrait récupérer les détails d\'un match par ID', async () => {
    const mockMatch = createMockMatch()
    vi.mocked(mockClient.get).mockResolvedValue(mockMatch)

    const result = await service.getMatchById('EUW1_1234567890')

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/lol/match/v5/matches/EUW1_1234567890'
    )
    expect(result).toEqual(mockMatch)
  })

  it('devrait lancer une erreur si Match ID est vide', async () => {
    await expect(service.getMatchById('')).rejects.toThrow('Match ID is required')
  })

  // ============================================================================
  // findCommonMatch
  // ============================================================================

  it('devrait trouver un match commun entre deux joueurs', async () => {
    const mockMatch = createMockMatch()

    vi.mocked(mockClient.get)
      .mockResolvedValueOnce(['EUW1_111', 'EUW1_222', 'EUW1_333']) // matchIds1
      .mockResolvedValueOnce(['EUW1_444', 'EUW1_222', 'EUW1_555']) // matchIds2
      .mockResolvedValueOnce(mockMatch) // match details

    const result = await service.findCommonMatch('puuid-player1', 'puuid-player2')

    // Should find EUW1_222 as common match
    expect(mockClient.get).toHaveBeenCalledTimes(3)
    expect(result).toEqual(mockMatch)
  })

  it('devrait retourner null si aucun match commun', async () => {
    vi.mocked(mockClient.get)
      .mockResolvedValueOnce(['EUW1_111', 'EUW1_222']) // matchIds1
      .mockResolvedValueOnce(['EUW1_333', 'EUW1_444']) // matchIds2

    const result = await service.findCommonMatch('puuid1', 'puuid2')

    expect(result).toBeNull()
  })

  it('devrait retourner null si les joueurs sont dans des équipes différentes (soloQ)', async () => {
    const soloQMatch = createMockSoloQMatch()

    vi.mocked(mockClient.get)
      .mockResolvedValueOnce(['EUW1_222']) // matchIds1
      .mockResolvedValueOnce(['EUW1_222']) // matchIds2
      .mockResolvedValueOnce(soloQMatch) // match with different teams

    const result = await service.findCommonMatch('puuid-player1', 'puuid-player2')

    // Should return null because players are in different teams
    expect(result).toBeNull()
  })

  it('devrait utiliser la région fournie pour le routing', async () => {
    vi.mocked(mockClient.get)
      .mockResolvedValueOnce([]) // matchIds1
      .mockResolvedValueOnce([]) // matchIds2

    await service.findCommonMatch('puuid1', 'puuid2', 'na1')

    // Both calls should use americas routing
    expect(mockClient.get).toHaveBeenCalledWith(
      'https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/puuid1/ids?count=5&queue=420'
    )
    expect(mockClient.get).toHaveBeenCalledWith(
      'https://americas.api.riotgames.com/lol/match/v5/matches/by-puuid/puuid2/ids?count=5&queue=420'
    )
  })

  // ============================================================================
  // isMatchRecent
  // ============================================================================

  it('devrait détecter qu\'un match est récent (< 4 heures)', () => {
    const recentMatch = createMockMatch()
    const result = service.isMatchRecent(recentMatch)

    expect(result).toBe(true)
  })

  it('devrait détecter qu\'un match est ancien (> 4 heures)', () => {
    const oldMatch = createMockOldMatch()
    const result = service.isMatchRecent(oldMatch)

    expect(result).toBe(false)
  })

  // ============================================================================
  // isRemake
  // ============================================================================

  it('devrait détecter qu\'un match est un remake (< 5 minutes)', () => {
    const remakeMatch = createMockRemake()
    const result = service.isRemake(remakeMatch)

    expect(result).toBe(true)
  })

  it('devrait détecter qu\'un match n\'est pas un remake (>= 5 minutes)', () => {
    const normalMatch = createMockMatch()
    const result = service.isRemake(normalMatch)

    expect(result).toBe(false)
  })
})
