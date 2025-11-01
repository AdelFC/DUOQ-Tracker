/**
 * Tests for AccountService
 *
 * Tests Account-v1 API calls for retrieving player PUUIDs
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AccountService } from '../../../services/riot/account'
import { RiotClient, RiotApiError } from '../../../services/riot/client'
import { MOCK_ACCOUNT } from './fixtures/account.fixture'

describe('AccountService', () => {
  let service: AccountService
  let mockClient: RiotClient

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
    } as any

    service = new AccountService(mockClient)
  })

  it('devrait récupérer un compte par Riot ID', async () => {
    vi.mocked(mockClient.get).mockResolvedValue(MOCK_ACCOUNT)

    const result = await service.getAccountByRiotId('TestPlayer', 'EUW')

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestPlayer/EUW'
    )
    expect(result).toEqual(MOCK_ACCOUNT)
  })

  it('devrait encoder les caractères spéciaux dans gameName et tagLine', async () => {
    vi.mocked(mockClient.get).mockResolvedValue(MOCK_ACCOUNT)

    await service.getAccountByRiotId('Player Name', 'EU W')

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://europe.api.riotgames.com/riot/account/v1/accounts/by-riot-id/Player%20Name/EU%20W'
    )
  })

  it('devrait utiliser la région fournie pour le routing', async () => {
    vi.mocked(mockClient.get).mockResolvedValue(MOCK_ACCOUNT)

    await service.getAccountByRiotId('TestPlayer', 'NA1', 'na1')

    expect(mockClient.get).toHaveBeenCalledWith(
      'https://americas.api.riotgames.com/riot/account/v1/accounts/by-riot-id/TestPlayer/NA1'
    )
  })

  it('devrait lancer une erreur si gameName est vide', async () => {
    await expect(service.getAccountByRiotId('', 'EUW')).rejects.toThrow(
      'gameName and tagLine are required'
    )
  })

  it('devrait lancer une erreur si tagLine est vide', async () => {
    await expect(service.getAccountByRiotId('TestPlayer', '')).rejects.toThrow(
      'gameName and tagLine are required'
    )
  })
})
