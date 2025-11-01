/**
 * Integration Tests with Real Riot API
 *
 * These tests use a real API key to test against Riot's production servers.
 * Run with: npm test -- src/tests/services/riot/integration.test.ts
 *
 * NOTE: These tests are skipped by default. Set RIOT_API_KEY env var to enable them.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { RiotService } from '../../../services/riot'

const RIOT_API_KEY = process.env.RIOT_API_KEY
const shouldRunIntegrationTests = !!RIOT_API_KEY

// Skip tests if no API key - these require a valid RIOT_API_KEY environment variable
const describeIntegration = shouldRunIntegrationTests ? describe : describe.skip

describeIntegration('RiotService - Integration Tests', () => {
  let riotService: RiotService

  beforeAll(() => {
    riotService = new RiotService({ apiKey: RIOT_API_KEY })
  })

  it('devrait récupérer le compte Risotto#CR7 (EUW)', async () => {
    const account = await riotService.getAccountByRiotId('Risotto', 'CR7', 'euw1')

    expect(account).toBeDefined()
    expect(account.gameName).toBe('Risotto')
    expect(account.tagLine).toBe('CR7')
    expect(account.puuid).toBeDefined()
    expect(account.puuid.length).toBeGreaterThan(0)

    console.log('✓ Compte trouvé:', account)
  }, 10000)

  it('devrait récupérer l\'historique de match de Risotto#CR7', async () => {
    // First get the account to get PUUID
    const account = await riotService.getAccountByRiotId('Risotto', 'CR7', 'euw1')

    // Get recent ranked solo/duo matches
    const matchIds = await riotService.getMatchIds(account.puuid, 'euw1', 5, 420)

    expect(matchIds).toBeDefined()
    expect(Array.isArray(matchIds)).toBe(true)
    expect(matchIds.length).toBeGreaterThan(0)
    expect(matchIds.length).toBeLessThanOrEqual(5)

    // All match IDs should start with region code
    matchIds.forEach((id) => {
      expect(id).toMatch(/^EUW1_\d+$/)
    })

    console.log(`✓ ${matchIds.length} matchs récents trouvés:`, matchIds)
  }, 10000)

  it('devrait récupérer les détails d\'un match de Risotto#CR7', async () => {
    // Get account
    const account = await riotService.getAccountByRiotId('Risotto', 'CR7', 'euw1')

    // Get most recent match
    const matchIds = await riotService.getMatchIds(account.puuid, 'euw1', 1, 420)
    expect(matchIds.length).toBeGreaterThan(0)

    // Get match details
    const matchData = await riotService.getMatch(matchIds[0], 'euw1')

    expect(matchData).toBeDefined()
    expect(matchData.metadata.matchId).toBe(matchIds[0])
    expect(matchData.info.queueId).toBe(420) // Solo/Duo Ranked

    // Find Risotto's participant data
    const risottoParticipant = matchData.info.participants.find((p) => p.puuid === account.puuid)
    expect(risottoParticipant).toBeDefined()
    expect([100, 200]).toContain(risottoParticipant!.teamId) // Blue or Red team
    expect(risottoParticipant!.championName).toBeDefined()

    console.log('✓ Match détails:', {
      matchId: matchData.metadata.matchId,
      champion: risottoParticipant!.championName,
      result: risottoParticipant!.win ? 'Victoire' : 'Défaite',
      kda: `${risottoParticipant!.kills}/${risottoParticipant!.deaths}/${risottoParticipant!.assists}`,
      duration: `${Math.floor(matchData.info.gameDuration / 60)}min`,
    })
  }, 10000)

  it('devrait vérifier si un match est récent ou ancien', async () => {
    const account = await riotService.getAccountByRiotId('Risotto', 'CR7', 'euw1')
    const matchIds = await riotService.getMatchIds(account.puuid, 'euw1', 1, 420)
    const matchData = await riotService.getMatch(matchIds[0], 'euw1')

    const isRecent = riotService.isMatchRecent(matchData)
    const isRemake = riotService.isRemake(matchData)

    // Match should either be recent or old (boolean)
    expect(typeof isRecent).toBe('boolean')

    // Match should not be a remake (unless very unlucky timing)
    expect(isRemake).toBe(false)

    const ageInHours = (Date.now() - matchData.info.gameEndTimestamp) / (1000 * 60 * 60)

    console.log('✓ Match age:', {
      isRecent: isRecent ? '< 4h' : '> 4h',
      actualAge: `${ageInHours.toFixed(1)}h`,
      isRemake,
      duration: `${Math.floor(matchData.info.gameDuration / 60)}min`,
    })
  }, 10000)

  it('devrait gérer les erreurs 404 pour un compte inexistant', async () => {
    await expect(
      riotService.getAccountByRiotId('ThisPlayerDoesNotExist123456789', 'NOPE', 'euw1')
    ).rejects.toThrow()
  }, 10000)
})
