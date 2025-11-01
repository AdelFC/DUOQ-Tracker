/**
 * Tests pour le handler REGISTER
 *
 * Le handler permet à un joueur de lier son compte Riot avec :
 * - Son Riot ID (gameName#tagLine)
 * - Son rôle principal (TOP, JUNGLE, MID, ADC, SUPPORT)
 * - Son champion principal
 * - Son peak elo (elo de référence pour balancing)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { registerHandler } from '../../../handlers/auth/register.handler.js'
import { state, message } from '../../fixtures/builders.js'
import { MessageType } from '../../../types/message.js'
import type { State } from '../../../types/state.js'
import type { Response } from '../../../types/message.js'

describe('registerHandler', () => {
  let testState: State
  let responses: Response[]

  beforeEach(() => {
    testState = state().build()
    responses = []
  })

  describe('Success cases', () => {
    it('should register player with valid data', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Risotto#CR7',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G2',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      // Vérifier que le joueur est créé
      expect(testState.players.has('discord123')).toBe(true)

      const player = testState.players.get('discord123')!
      expect(player.gameName).toBe('Risotto')
      expect(player.tagLine).toBe('CR7')
      expect(player.mainRoleString).toBe('MID')
      expect(player.mainChampion).toBe('Yasuo')
      expect(player.peakElo).toBe('G2')
      expect(player.initialRank).toBe('G2')
      expect(player.discordId).toBe('discord123')
      expect(player.role).toBe('noob') // Par défaut
      expect(player.duoId).toBe(0) // Pas encore en duo

      // Vérifier la réponse
      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.SUCCESS)
      expect(responses[0].targetId).toBe('discord123')
      expect(responses[0].content).toContain('lié avec succès')
      expect(responses[0].content).toContain('Risotto#CR7')
      expect(responses[0].content).toContain('MID')
      expect(responses[0].content).toContain('Yasuo')
      expect(responses[0].content).toContain('G2')
    })

    it('should handle all main roles', () => {
      const roles = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT']

      roles.forEach((role, index) => {
        const discordId = `discord${index}`
        const msg = message()
          .withType(MessageType.REGISTER)
          .withPayload({
            riotId: `Player${index}#EUW`,
            mainRole: role,
            mainChampion: 'Champ',
            peakElo: 'G4',
          })
          .fromSource(discordId)
          .build()

        registerHandler(msg, testState, responses)

        const player = testState.players.get(discordId)!
        expect(player.mainRoleString).toBe(role)
      })
    })

    it('should handle all rank formats (IRON to CHALLENGER)', () => {
      const ranks = ['I4', 'B3', 'S2', 'G1', 'P4', 'E3', 'D2', 'M', 'GM', 'C']

      ranks.forEach((rank, index) => {
        const discordId = `discord${index}`
        const msg = message()
          .withType(MessageType.REGISTER)
          .withPayload({
            riotId: `Player${index}#EUW`,
            mainRole: 'MID',
            mainChampion: 'Yasuo',
            peakElo: rank,
          })
          .fromSource(discordId)
          .build()

        registerHandler(msg, testState, responses)

        const player = testState.players.get(discordId)!
        expect(player.peakElo).toBe(rank)
        expect(player.initialRank).toBe(rank)
      })
    })

    it('should initialize player stats to zero', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'NewPlayer#EUW',
          mainRole: 'ADC',
          mainChampion: 'Jinx',
          peakElo: 'G4',
        })
        .fromSource('discord999')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord999')!
      expect(player.totalPoints).toBe(0)
      expect(player.gamesPlayed).toBe(0)
      expect(player.wins).toBe(0)
      expect(player.losses).toBe(0)
      expect(player.streaks.current).toBe(0)
      expect(player.streaks.longestWin).toBe(0)
      expect(player.streaks.longestLoss).toBe(0)
      expect(player.puuid).toBe('mock_puuid_discord999') // Mock PUUID when no riotService available
      expect(player.detectedMainRole).toBeNull()
    })

    it('should set registeredAt timestamp', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'JUNGLE',
          mainChampion: 'Lee Sin',
          peakElo: 'G4',
        })
        .fromSource('discord111')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord111')!
      expect(player.registeredAt).toBeInstanceOf(Date)
      expect(player.lastGameAt).toBeNull()
    })

    it('should parse Riot ID with spaces', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player Name#123',
          mainRole: 'SUPPORT',
          mainChampion: 'Thresh',
          peakElo: 'S3',
        })
        .fromSource('discord789')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord789')!
      expect(player.gameName).toBe('Player Name')
      expect(player.tagLine).toBe('123')
    })
  })

  describe('Validation errors', () => {
    it('should reject if already registered', () => {
      // Enregistrer une première fois
      testState.players.set('discord123', {
        discordId: 'discord123',
        puuid: '',
        gameName: 'ExistingPlayer',
        tagLine: 'EUW',
        role: 'noob',
        duoId: 0,
        peakElo: 'G4',
        initialRank: 'G4',
        currentRank: { tier: 'GOLD', division: 'IV', lp: 50 },
        mainRoleString: 'MID',
        mainChampion: 'Yasuo',
        detectedMainRole: null,
        totalPoints: 0,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        streaks: { current: 0, longestWin: 0, longestLoss: 0 },
        registeredAt: new Date(),
        lastGameAt: null,
      })

      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'NewPlayer#EUW',
          mainRole: 'ADC',
          mainChampion: 'Jinx',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('déjà lié')
    })

    it('should reject missing riotId', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('riotId')
    })

    it('should reject missing mainRole', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('rôle principal')
    })

    it('should reject missing mainChampion', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('champion principal')
    })

    it('should reject missing peakElo', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('peak elo')
    })

    it('should reject invalid riotId format (no #)', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'PlayerEUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('format')
    })

    it('should reject invalid mainRole', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'INVALID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('TOP, JUNGLE, MID, ADC ou SUPPORT')
    })

    it('should reject empty peakElo', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: '',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('peak elo')
    })

    it('should reject empty gameName', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: '#EUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('gameName')
    })

    it('should reject empty tagLine', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('tagLine')
    })

    it('should reject empty mainChampion', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          mainChampion: '',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
      expect(responses[0].content).toContain('champion principal')
    })
  })

  describe('Edge cases', () => {
    it('should handle riotId with multiple # characters', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#Name#EUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      expect(responses).toHaveLength(1)
      expect(responses[0].type).toBe(MessageType.ERROR)
    })

    it('should trim whitespace from riotId', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: '  Player#EUW  ',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord123')!
      expect(player.gameName).toBe('Player')
      expect(player.tagLine).toBe('EUW')
    })

    it('should normalize mainRole to uppercase', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'mid',
          mainChampion: 'Yasuo',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord123')!
      expect(player.mainRoleString).toBe('MID')
    })

    it('should normalize peakElo to uppercase', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          mainChampion: 'Yasuo',
          peakElo: 'g4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord123')!
      expect(player.peakElo).toBe('G4')
      expect(player.initialRank).toBe('G4')
    })

    it('should trim whitespace from mainChampion', () => {
      const msg = message()
        .withType(MessageType.REGISTER)
        .withPayload({
          riotId: 'Player#EUW',
          mainRole: 'MID',
          mainChampion: '  Yasuo  ',
          peakElo: 'G4',
        })
        .fromSource('discord123')
        .build()

      registerHandler(msg, testState, responses)

      const player = testState.players.get('discord123')!
      expect(player.mainChampion).toBe('Yasuo')
    })
  })
})
