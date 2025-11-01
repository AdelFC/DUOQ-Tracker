/**
 * Tests for GameTrackerStateManager
 *
 * Tests in-memory state management for duo tracking
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { GameTrackerStateManager } from '../../../services/game-tracker/state-manager'
import { GameTrackerConfig } from '../../../services/game-tracker/types'

describe('GameTrackerStateManager', () => {
  let stateManager: GameTrackerStateManager
  const config: GameTrackerConfig = {
    pollingInterval: 10000,
    minCheckInterval: 30000,
    maxConcurrentChecks: 5,
    maxFetchAttempts: 18,
    region: 'euw1',
  }

  beforeEach(() => {
    stateManager = new GameTrackerStateManager(config)
  })

  it('devrait ajouter un duo au tracking', () => {
    stateManager.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')

    const tracking = stateManager.getTracking('duo-1')
    expect(tracking).toBeDefined()
    expect(tracking!.duoId).toBe('duo-1')
    expect(tracking!.noobPuuid).toBe('puuid-noob')
    expect(tracking!.carryPuuid).toBe('puuid-carry')
    expect(tracking!.state).toBe('idle')
    expect(tracking!.lastCheckedAt).toBe(0) // Force immediate check
  })

  it('ne devrait pas ajouter un duo déjà tracké', () => {
    stateManager.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')
    stateManager.addDuo('duo-1', 'puuid-noob2', 'puuid-carry2', 'user-noob2', 'user-carry2')

    const tracking = stateManager.getTracking('duo-1')
    expect(tracking!.noobPuuid).toBe('puuid-noob') // Original values
  })

  it('devrait retirer un duo du tracking', () => {
    stateManager.addDuo('duo-1', 'puuid-noob', 'puuid-carry', 'user-noob', 'user-carry')
    expect(stateManager.getTracking('duo-1')).toBeDefined()

    stateManager.removeDuo('duo-1')
    expect(stateManager.getTracking('duo-1')).toBeUndefined()
  })

  it('devrait récupérer tous les trackings', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')
    stateManager.addDuo('duo-2', 'puuid-3', 'puuid-4', 'user-3', 'user-4')
    stateManager.addDuo('duo-3', 'puuid-5', 'puuid-6', 'user-5', 'user-6')

    const allTrackings = stateManager.getAllTrackings()
    expect(allTrackings).toHaveLength(3)
  })

  it('devrait retourner les duos à vérifier (rate limit respecté)', () => {
    const now = Date.now()

    // Add 3 duos
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')
    stateManager.addDuo('duo-2', 'puuid-3', 'puuid-4', 'user-3', 'user-4')
    stateManager.addDuo('duo-3', 'puuid-5', 'puuid-6', 'user-5', 'user-6')

    // Update duo-1: checked 5s ago (should NOT be checked, < 30s)
    const tracking1 = stateManager.getTracking('duo-1')!
    tracking1.lastCheckedAt = now - 5000

    // Update duo-2: checked 35s ago (SHOULD be checked, > 30s)
    const tracking2 = stateManager.getTracking('duo-2')!
    tracking2.lastCheckedAt = now - 35000

    // duo-3: lastCheckedAt = 0 (SHOULD be checked immediately)

    const duosToCheck = stateManager.getDuosToCheck()
    expect(duosToCheck).toHaveLength(2) // duo-2 and duo-3
    expect(duosToCheck.map((d) => d.duoId)).toContain('duo-2')
    expect(duosToCheck.map((d) => d.duoId)).toContain('duo-3')
  })

  it('devrait mettre à jour le state d\'un duo', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')

    stateManager.updateState('duo-1', 'in_game')
    const tracking = stateManager.getTracking('duo-1')!
    expect(tracking.state).toBe('in_game')
    expect(tracking.lastCheckedAt).toBeGreaterThan(0)
  })

  it('devrait marquer un duo comme en game', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')

    stateManager.setInGame('duo-1', 'EUW1_123456789')
    const tracking = stateManager.getTracking('duo-1')!
    expect(tracking.state).toBe('in_game')
    expect(tracking.currentGameId).toBe('EUW1_123456789')
  })

  it('devrait marquer une game comme terminée', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')
    stateManager.setInGame('duo-1', 'EUW1_123456789')

    stateManager.setGameEnded('duo-1')
    const tracking = stateManager.getTracking('duo-1')!
    expect(tracking.state).toBe('game_ended')
    expect(tracking.fetchAttempts).toBe(0)
  })

  it('devrait incrémenter les tentatives de fetch', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')

    let maxReached = stateManager.incrementFetchAttempts('duo-1')
    expect(maxReached).toBe(false)

    const tracking = stateManager.getTracking('duo-1')!
    expect(tracking.fetchAttempts).toBe(1)

    // Increment jusqu'à la limite (18)
    for (let i = 1; i < 18; i++) {
      maxReached = stateManager.incrementFetchAttempts('duo-1')
    }

    expect(maxReached).toBe(true) // Reached max (18)
    expect(tracking.fetchAttempts).toBe(18)
  })

  it('devrait reset un duo à idle', () => {
    stateManager.addDuo('duo-1', 'puuid-1', 'puuid-2', 'user-1', 'user-2')
    stateManager.setInGame('duo-1', 'EUW1_123456789')
    stateManager.setGameEnded('duo-1')

    // Increment fetch attempts
    stateManager.incrementFetchAttempts('duo-1')
    stateManager.incrementFetchAttempts('duo-1')

    stateManager.resetToIdle('duo-1')

    const tracking = stateManager.getTracking('duo-1')!
    expect(tracking.state).toBe('idle')
    expect(tracking.currentGameId).toBeUndefined()
    expect(tracking.fetchAttempts).toBe(0)
  })
})
