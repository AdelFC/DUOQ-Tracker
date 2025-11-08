/**
 * Auto Poll Service
 *
 * Automatically polls for completed games every X seconds
 * Uses the same logic as /poll command but runs continuously
 *
 * Unlike the old GameTracker (which tried to detect games in progress),
 * this service only looks for already-completed games.
 */

import type { Client } from 'discord.js'
import type { State } from '../types/state.js'
import type { RiotApiService } from './riot/riot-api.service.js'
import { logError, logWarn } from '../utils/discord-logger.js'

export class AutoPollService {
  private intervalId: NodeJS.Timeout | null = null
  private isPolling = false
  private currentIntervalMs: number

  /**
   * Riot API Rate Limits:
   * - 20 requests / 1 second
   * - 100 requests / 2 minutes
   *
   * Per duo per poll:
   * - 2 calls: getRecentMatchIds (noob + carry)
   * - ~1 call: getMatchDetails (average, only for new matches)
   * - ~2 calls: getRank (average, only for new matches)
   * - Total: ~5 calls per duo per poll
   *
   * Tiered interval system (by duo count):
   * - 1-4 duos: 30s (~8-16 calls/min)
   * - 5-8 duos: 45s (~13-21 calls/min)
   * - 9-12 duos: 60s (~18-24 calls/min)
   * - 13-16 duos: 90s (~17-21 calls/min)
   * - 17-20 duos: 120s (~17-20 calls/min)
   * - 21+ duos: 150s+ (scales linearly: nbDuos * 7.5s)
   *
   * All tiers stay under 40 calls/min (80% safety margin)
   */
  private readonly TIER_INTERVALS = [
    { maxDuos: 4, intervalMs: 30000 },   // 1-4 duos: 30s
    { maxDuos: 8, intervalMs: 45000 },   // 5-8 duos: 45s
    { maxDuos: 12, intervalMs: 60000 },  // 9-12 duos: 60s
    { maxDuos: 16, intervalMs: 90000 },  // 13-16 duos: 90s
    { maxDuos: 20, intervalMs: 120000 }, // 17-20 duos: 120s
  ]
  private readonly LINEAR_MS_PER_DUO = 7500 // For 21+ duos: 7.5s per duo

  constructor(
    private client: Client,
    private state: State,
    private riotService: RiotApiService,
    private baseIntervalMs: number = 60000 // Fallback if no duos
  ) {
    this.currentIntervalMs = baseIntervalMs
  }

  /**
   * Calculate optimal polling interval based on number of duos (tiered system)
   */
  private calculateInterval(): number {
    const nbDuos = this.state.duos.size

    if (nbDuos === 0) {
      return this.baseIntervalMs
    }

    // Check tier intervals
    for (const tier of this.TIER_INTERVALS) {
      if (nbDuos <= tier.maxDuos) {
        return tier.intervalMs
      }
    }

    // For 21+ duos, use linear scaling
    return nbDuos * this.LINEAR_MS_PER_DUO
  }

  /**
   * Adjust interval if number of duos changed significantly
   */
  private adjustIntervalIfNeeded(): void {
    const optimalInterval = this.calculateInterval()

    // Only adjust if difference is more than 10%
    const difference = Math.abs(optimalInterval - this.currentIntervalMs)
    const threshold = this.currentIntervalMs * 0.1

    if (difference > threshold) {
      const oldInterval = this.currentIntervalMs
      this.currentIntervalMs = optimalInterval

      console.log(
        `[AutoPoll] Interval adjusted: ${oldInterval / 1000}s → ${optimalInterval / 1000}s (${this.state.duos.size} duos)`
      )

      // Restart with new interval
      this.stop()
      this.start()
    }
  }

  /**
   * Start automatic polling with dynamic interval
   */
  start(): void {
    if (this.intervalId) {
      console.log('[AutoPoll] Already running')
      return
    }

    // Calculate optimal interval based on current number of duos
    this.currentIntervalMs = this.calculateInterval()

    const nbDuos = this.state.duos.size
    const callsPerMin = nbDuos > 0 ? (60000 / this.currentIntervalMs) * nbDuos * 2 : 0

    console.log(
      `[AutoPoll] Started - Interval: ${this.currentIntervalMs / 1000}s | Duos: ${nbDuos} | Est. API calls: ~${Math.round(callsPerMin)}/min`
    )

    // Poll immediately on start
    this.poll()

    // Then poll at regular intervals
    this.intervalId = setInterval(() => {
      this.poll()
    }, this.currentIntervalMs)
  }

  /**
   * Stop automatic polling
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[AutoPoll] Stopped')
    }
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.intervalId !== null
  }

  /**
   * Main polling logic - checks all duos for completed games
   */
  private async poll(): Promise<void> {
    // Prevent concurrent polls
    if (this.isPolling) {
      return
    }

    this.isPolling = true

    try {
      const duos = Array.from(this.state.duos.values())

      if (duos.length === 0) {
        // No duos to track - silent
        this.isPolling = false
        return
      }

      let totalGamesFound = 0

      for (const duo of duos) {
        const noob = this.state.players.get(duo.noobId)
        const carry = this.state.players.get(duo.carryId)

        if (!noob || !carry) {
          continue
        }

        if (!noob.puuid || !carry.puuid) {
          continue
        }

        try {
          // Get recent matches for both players (queue 420 = ranked solo/duo)
          const [noobMatches, carryMatches] = await Promise.all([
            this.riotService.getRecentMatchIds(noob.puuid, 5, 420),
            this.riotService.getRecentMatchIds(carry.puuid, 5, 420),
          ])

          // Find common matches
          const commonMatches = noobMatches.filter((id) => carryMatches.includes(id))

          for (const matchId of commonMatches) {
            // Skip if already tracked
            if (this.state.games.has(matchId)) {
              continue
            }

            // Get match details
            const matchDetails = await this.riotService.getMatchDetails(matchId)
            if (!matchDetails) {
              continue
            }

            // Verify ranked solo/duo
            if (matchDetails.queueId !== 420) {
              continue
            }

            // Filter by event start date
            const eventStartDate =
              typeof this.state.config === 'object' && 'getSync' in this.state.config
                ? this.state.config.getSync('eventStartDate')
                : (this.state.config as any).eventStartDate

            if (eventStartDate) {
              const startDate = new Date(eventStartDate)
              const gameStartTime = new Date(matchDetails.gameCreation)

              if (gameStartTime < startDate) {
                // Game started before challenge - skip it
                continue
              }
            }

            // Verify same team
            const noobData = matchDetails.participants.find((p) => p.puuid === noob.puuid)
            const carryData = matchDetails.participants.find((p) => p.puuid === carry.puuid)

            if (!noobData || !carryData || noobData.teamId !== carryData.teamId) {
              continue
            }

            // NEW GAME FOUND! Add to state
            const gameStartTime = new Date(matchDetails.gameCreation)
            this.state.games.set(matchId, {
              id: matchId,
              matchId: matchId,
              duoId: duo.id,
              startTime: gameStartTime,
              endTime: new Date(matchDetails.gameCreation + matchDetails.gameDuration * 1000),
              createdAt: gameStartTime,
              win: noobData.win,
              noobKDA: `${noobData.kills}/${noobData.deaths}/${noobData.assists}`,
              carryKDA: `${carryData.kills}/${carryData.deaths}/${carryData.assists}`,
              noobKills: noobData.kills,
              noobDeaths: noobData.deaths,
              noobAssists: noobData.assists,
              carryKills: carryData.kills,
              carryDeaths: carryData.deaths,
              carryAssists: carryData.assists,
              noobChampion: noobData.championName,
              carryChampion: carryData.championName,
              duration: matchDetails.gameDuration,
              scored: false,
              pointsAwarded: 0,
            })

            totalGamesFound++

            // Skip "game found" notification - only send final scored result
            // await this.notifyGameFound(duo, noob, carry, noobData.win)

            // Auto-score the game (sends notification with full results)
            await this.scoreGame(matchId, duo, noob, carry, matchDetails, noobData, carryData)

            console.log(`[AutoPoll] Found and scored game ${matchId} for duo ${duo.name}`)
          }
        } catch (error) {
          console.error(`[AutoPoll] Error polling duo ${duo.id}:`, error)
          await logError(`Erreur polling duo ${duo.name} (ID: ${duo.id})`, error as Error)
        }
      }

      // Silent if no games found (no spam)
      if (totalGamesFound > 0) {
        console.log(`[AutoPoll] Found ${totalGamesFound} new game(s)`)
      }

      // Check if we need to adjust interval based on number of duos
      this.adjustIntervalIfNeeded()
    } catch (error) {
      console.error('[AutoPoll] Error during poll:', error)
      await logError('Erreur critique dans AutoPoll service', error as Error)
    } finally {
      this.isPolling = false
    }
  }

  /**
   * Send game found notification to tracker channel
   */
  private async notifyGameFound(
    duo: any,
    noob: any,
    carry: any,
    win: boolean
  ): Promise<void> {
    const trackerChannelId =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? (this.state.config as any).getSync('trackerChannelId')
        : (this.state.config as any).trackerChannelId

    if (!trackerChannelId) {
      return
    }

    try {
      const { formatGameFound } = await import('../formatters/embeds.js')
      const { EmbedBuilder } = await import('discord.js')

      const embed = formatGameFound({
        duoName: duo.name || `${noob.gameName} & ${carry.gameName}`,
        noobName: `${noob.gameName}#${noob.tagLine}`,
        carryName: `${carry.gameName}#${carry.tagLine}`,
        win,
      })

      const embedBuilder = new EmbedBuilder()
        .setTitle(embed.title || null)
        .setDescription(embed.description || null)
        .setColor(embed.color || 0x5865f2)

      if (embed.footer) {
        embedBuilder.setFooter({ text: embed.footer.text })
      }

      if (embed.timestamp) {
        embedBuilder.setTimestamp(embed.timestamp)
      }

      const channel = await this.client.channels.fetch(trackerChannelId)
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send({ embeds: [embedBuilder] })
      }
    } catch (error) {
      console.error('[AutoPoll] Error sending notification:', error)
    }
  }

  /**
   * Automatically score a game
   */
  private async scoreGame(
    matchId: string,
    duo: any,
    noob: any,
    carry: any,
    matchDetails: any,
    noobData: any,
    carryData: any
  ): Promise<void> {
    try {
      const { calculateGameScore } = await import('./scoring/engine.js')

      // Helper: Convert user-friendly role to Riot API lane
      const roleToLane = (role: string): string => {
        const mapping: Record<string, string> = {
          TOP: 'TOP',
          JUNGLE: 'JUNGLE',
          MID: 'MIDDLE',
          ADC: 'BOTTOM',
          SUPPORT: 'UTILITY',
        }
        return mapping[role.toUpperCase()] || role
      }

      // Fetch current ranks from Riot API
      let noobNewRank = noob.currentRank
      let carryNewRank = carry.currentRank

      try {
        const [noobRank, carryRank] = await Promise.all([
          this.riotService.getRankBySummonerId(noobData.summonerId),
          this.riotService.getRankBySummonerId(carryData.summonerId),
        ])

        if (noobRank) noobNewRank = noobRank
        if (carryRank) carryNewRank = carryRank
      } catch (error) {
        console.warn('[AutoPoll] Failed to fetch ranks, using current ranks:', error)
      }

      // Create GameData
      const gameData = {
        matchId,
        gameId: matchDetails.gameId,
        startTime: new Date(matchDetails.gameStartTimestamp),
        endTime: new Date(matchDetails.gameEndTimestamp),
        duration: matchDetails.gameDuration,
        duoId: duo.id,
        win: noobData.win,
        remake: matchDetails.gameEndedInEarlySurrender,
        surrender: matchDetails.gameEndedInSurrender,
        status: 'COMPLETED' as const,
        detectedAt: new Date(),
        scoredAt: null,
        noobStats: {
          puuid: noob.puuid || '',
          summonerId: noobData.summonerId,
          teamId: noobData.teamId,
          championId: noobData.championId,
          championName: noobData.championName,
          lane: (noobData.teamPosition || 'UNKNOWN') as any,
          kills: noobData.kills,
          deaths: noobData.deaths,
          assists: noobData.assists,
          previousRank: noob.currentRank,
          newRank: noobNewRank,
          peakElo: noob.peakElo,
          isOffRole: noob.mainRoleString
            ? roleToLane(noob.mainRoleString) !== noobData.teamPosition
            : false,
          isOffChampion: noob.mainChampion ? noob.mainChampion !== noobData.championName : false,
          // Multikills (bonus spéciaux)
          pentaKills: noobData.pentaKills,
          quadraKills: noobData.quadraKills,
          tripleKills: noobData.tripleKills,
          firstBloodKill: noobData.firstBloodKill,
          largestKillingSpree: noobData.largestKillingSpree,
        },
        carryStats: {
          puuid: carry.puuid || '',
          summonerId: carryData.summonerId,
          teamId: carryData.teamId,
          championId: carryData.championId,
          championName: carryData.championName,
          lane: (carryData.teamPosition || 'UNKNOWN') as any,
          kills: carryData.kills,
          deaths: carryData.deaths,
          assists: carryData.assists,
          previousRank: carry.currentRank,
          newRank: carryNewRank,
          peakElo: carry.peakElo,
          isOffRole: carry.mainRoleString
            ? roleToLane(carry.mainRoleString) !== carryData.teamPosition
            : false,
          isOffChampion: carry.mainChampion
            ? carry.mainChampion !== carryData.championName
            : false,
          // Multikills (bonus spéciaux)
          pentaKills: carryData.pentaKills,
          quadraKills: carryData.quadraKills,
          tripleKills: carryData.tripleKills,
          firstBloodKill: carryData.firstBloodKill,
          largestKillingSpree: carryData.largestKillingSpree,
        },
      }

      // Calculate score
      const scoreResult = calculateGameScore({
        gameData,
        noobStreak: noob.streaks.current,
        carryStreak: carry.streaks.current,
      })

      const noobPoints = scoreResult.noob.final
      const carryPoints = scoreResult.carry.final
      const duoPoints = scoreResult.total

      // Update player stats
      noob.totalPoints += noobPoints
      carry.totalPoints += carryPoints
      noob.currentRank = noobNewRank
      carry.currentRank = carryNewRank

      if (gameData.win) {
        noob.wins += 1
        noob.streaks.current += 1
        if (noob.streaks.current > noob.streaks.longestWin) {
          noob.streaks.longestWin = noob.streaks.current
        }
        carry.wins += 1
        carry.streaks.current += 1
        if (carry.streaks.current > carry.streaks.longestWin) {
          carry.streaks.longestWin = carry.streaks.current
        }
        duo.wins += 1
        duo.currentStreak += 1
        if (duo.currentStreak > duo.longestWinStreak) {
          duo.longestWinStreak = duo.currentStreak
        }
      } else {
        noob.losses += 1
        noob.streaks.current = 0
        carry.losses += 1
        carry.streaks.current = 0
        duo.losses += 1
        duo.currentStreak = 0
      }

      duo.totalPoints += duoPoints
      duo.gamesPlayed += 1
      duo.lastGameAt = new Date()

      // Mark game as scored
      const trackedGame = this.state.games.get(matchId)
      if (trackedGame) {
        trackedGame.scored = true
        trackedGame.pointsAwarded = duoPoints
      }

      // Send scoring notification
      await this.notifyGameScored(
        duo,
        noob,
        carry,
        noobData,
        carryData,
        gameData.win,
        noobPoints,
        carryPoints,
        duoPoints,
        matchDetails.gameDuration
      )
    } catch (error) {
      console.error('[AutoPoll] Error scoring game:', error)
      await logError(`Erreur scoring game ${matchId}`, error as Error)
    }
  }

  /**
   * Send game scored notification to tracker channel
   */
  private async notifyGameScored(
    duo: any,
    noob: any,
    carry: any,
    noobData: any,
    carryData: any,
    win: boolean,
    noobPoints: number,
    carryPoints: number,
    duoPoints: number,
    duration: number
  ): Promise<void> {
    const trackerChannelId =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? (this.state.config as any).getSync('trackerChannelId')
        : (this.state.config as any).trackerChannelId

    if (!trackerChannelId) {
      return
    }

    try {
      const { formatGameScored } = await import('../formatters/embeds.js')
      const { EmbedBuilder } = await import('discord.js')

      const embed = formatGameScored({
        win,
        noobName: `${noob.gameName}#${noob.tagLine}`,
        carryName: `${carry.gameName}#${carry.tagLine}`,
        noobKDA: `${noobData.kills}/${noobData.deaths}/${noobData.assists}`,
        carryKDA: `${carryData.kills}/${carryData.deaths}/${carryData.assists}`,
        noobPoints,
        carryPoints,
        totalPoints: duoPoints,
        duration,
      })

      const embedBuilder = new EmbedBuilder()
        .setTitle(embed.title || null)
        .setDescription(embed.description || null)
        .setColor(embed.color || 0x5865f2)

      if (embed.fields) {
        embedBuilder.addFields(embed.fields)
      }

      if (embed.footer) {
        embedBuilder.setFooter({ text: embed.footer.text })
      }

      if (embed.timestamp) {
        embedBuilder.setTimestamp(embed.timestamp)
      }

      const channel = await this.client.channels.fetch(trackerChannelId)
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send({ embeds: [embedBuilder] })
      }
    } catch (error) {
      console.error('[AutoPoll] Error sending scoring notification:', error)
    }
  }
}
