/**
 * Account API Fixtures
 * Mock responses for Riot Account-v1 API
 */

import { RiotAccount } from '../../../../services/riot/types'

export const MOCK_ACCOUNT: RiotAccount = {
  puuid: 'mock-puuid-1234567890',
  gameName: 'TestPlayer',
  tagLine: 'EUW',
}

export const RISOTTO_ACCOUNT: RiotAccount = {
  puuid: 'risotto-cr7-puuid', // Will be fetched from real API
  gameName: 'Risotto',
  tagLine: 'CR7',
}

/**
 * Mock 404 response when account not found
 */
export const ACCOUNT_NOT_FOUND_ERROR = {
  status: {
    message: 'Data not found - account not found',
    status_code: 404,
  },
}
