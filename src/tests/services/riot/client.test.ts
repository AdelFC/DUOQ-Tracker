/**
 * Tests for RiotClient
 *
 * Tests HTTP client with rate limiting, retry logic, and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RiotClient, RiotApiError, RateLimitError } from '../../../services/riot/client'
import axios, { AxiosError } from 'axios'

// Mock axios
vi.mock('axios')
const mockedAxios = axios as any

describe('RiotClient', () => {
  let client: RiotClient

  beforeEach(() => {
    vi.clearAllMocks()
    client = new RiotClient({ apiKey: 'test-api-key' })

    // Default mock: successful response
    mockedAxios.create.mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: { test: 'data' } }),
      post: vi.fn().mockResolvedValue({ data: { test: 'data' } }),
    })
  })

  it('devrait créer un client avec la clé API fournie', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      timeout: 10000,
      headers: {
        'X-Riot-Token': 'test-api-key',
      },
    })
  })

  it('devrait utiliser le timeout personnalisé si fourni', () => {
    new RiotClient({ apiKey: 'test-key', timeout: 5000 })

    expect(mockedAxios.create).toHaveBeenCalledWith({
      timeout: 5000,
      headers: {
        'X-Riot-Token': 'test-key',
      },
    })
  })

  it('devrait effectuer une requête GET avec succès', async () => {
    const mockInstance = {
      get: vi.fn().mockResolvedValue({ data: { puuid: 'test-puuid' } }),
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key' })
    const result = await client.get('https://test.api.com/endpoint')

    expect(mockInstance.get).toHaveBeenCalledWith('https://test.api.com/endpoint', undefined)
    expect(result).toEqual({ puuid: 'test-puuid' })
  })

  it('devrait lancer RiotApiError pour une erreur 404', async () => {
    const error = {
      response: {
        status: 404,
        data: {
          status: {
            message: 'Data not found',
            status_code: 404,
          },
        },
      },
      isAxiosError: true,
    }

    const mockInstance = {
      get: vi.fn().mockRejectedValue(error),
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key' })

    await expect(client.get('https://test.api.com/endpoint')).rejects.toThrow(RiotApiError)
    await expect(client.get('https://test.api.com/endpoint')).rejects.toThrow('Data not found')
  })

  it('devrait retry automatiquement sur une erreur 429 (rate limit)', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        headers: {
          'retry-after': '1', // 1 second
        },
      },
      isAxiosError: true,
    }

    const mockInstance = {
      get: vi
        .fn()
        .mockRejectedValueOnce(rateLimitError) // First call: rate limited
        .mockResolvedValueOnce({ data: { success: true } }), // Second call: success
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key' })

    // Mock sleep to avoid waiting
    vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined)

    const result = await client.get('https://test.api.com/endpoint')

    expect(mockInstance.get).toHaveBeenCalledTimes(2) // Retry once
    expect(result).toEqual({ success: true })
  })

  it('devrait lancer RateLimitError après maxRetries tentatives', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        headers: {
          'retry-after': '1',
        },
      },
      isAxiosError: true,
    }

    const mockInstance = {
      get: vi.fn().mockRejectedValue(rateLimitError), // Always rate limited
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key', maxRetries: 2 })

    // Mock sleep to avoid waiting
    vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined)

    await expect(client.get('https://test.api.com/endpoint')).rejects.toThrow(RateLimitError)

    // Should have tried 3 times total (initial + 2 retries)
    expect(mockInstance.get).toHaveBeenCalledTimes(3)
  })

  it('devrait utiliser Retry-After header pour déterminer le délai', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        headers: {
          'retry-after': '5', // 5 seconds
        },
      },
      isAxiosError: true,
    }

    const mockInstance = {
      get: vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { success: true } }),
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key' })

    const sleepSpy = vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined)

    await client.get('https://test.api.com/endpoint')

    // Should wait 5000ms (5 seconds)
    expect(sleepSpy).toHaveBeenCalledWith(5000)
  })

  it('devrait utiliser un délai par défaut si Retry-After manque', async () => {
    const rateLimitError = {
      response: {
        status: 429,
        headers: {}, // No Retry-After header
      },
      isAxiosError: true,
    }

    const mockInstance = {
      get: vi
        .fn()
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce({ data: { success: true } }),
    }
    mockedAxios.create.mockReturnValue(mockInstance)

    client = new RiotClient({ apiKey: 'test-key' })

    const sleepSpy = vi.spyOn(client as any, 'sleep').mockResolvedValue(undefined)

    await client.get('https://test.api.com/endpoint')

    // Should use default delay (2 seconds = 2000ms)
    expect(sleepSpy).toHaveBeenCalledWith(2000)
  })
})
