/**
 * Discord Bot Main Entry Point
 */

import { Client, GatewayIntentBits, Collection } from 'discord.js'
import { BotClient, BotConfig, CommandDefinition } from './types'
import { ready } from './events/ready'
import { interactionCreate } from './events/interactionCreate'
import {
  registerCommand,
  unregisterCommand,
  linkCommand,
  pollCommand,
  ladderCommand,
  profileCommand,
  historyCommand,
  devCommand,
  keyCommand,
  setupCommand,
  testCommand,
} from './commands'
import { DailyLadderService } from '../services/daily-ladder.js'
import { ApiKeyReminderService } from '../services/api-key-reminder.service.js'
import { router } from './router.js'

// Global service instances
let dailyLadderService: DailyLadderService | null = null
let apiKeyReminderService: ApiKeyReminderService | null = null
let botClient: BotClient | null = null

/**
 * NOTE: GameTracker automatic detection removed
 *
 * Riot API no longer provides real-time game status, so we cannot detect
 * when games start or end automatically. All game detection is now done
 * via manual polling (/poll command) which finds completed games.
 *
 * The code below (GAME_STARTED, GAME_ENDED, GAME_RESULT_FOUND events)
 * is kept for reference but is NO LONGER USED.
 */

/*
async function handleGameTrackerEvent_OBSOLETE(event: GameTrackerEvent, _messages: Message[]): Promise<void> {
  const state = router.getState()

  switch (event.type) {
    case 'GAME_STARTED': {
      // Get duo and player info
      const duo = state.duos.get(Number(event.duoId))
      if (!duo) {
        console.warn(`[GameTracker] Duo ${event.duoId} not found for GAME_STARTED event`)
        return
      }

      const noob = state.players.get(duo.noobId)
      const carry = state.players.get(duo.carryId)
      if (!noob || !carry) {
        console.warn(`[GameTracker] Players not found for duo ${event.duoId}`)
        return
      }

      // Get tracker channel from config
      const trackerChannelId =
        typeof state.config === 'object' && 'getSync' in state.config
          ? state.config.getSync('trackerChannelId')
          : (state.config as any).trackerChannelId

      if (!trackerChannelId) {
        console.warn('[GameTracker] No tracker channel configured')
        return
      }

      // Import formatGameDetected
      const { formatGameDetected } = await import('../formatters/embeds.js')
      const { EmbedBuilder } = await import('discord.js')

      // Create embed
      const embedData = formatGameDetected({
        duoName: duo.name || `${noob.gameName} & ${carry.gameName}`,
        noobName: `${noob.gameName}#${noob.tagLine}`,
        carryName: `${carry.gameName}#${carry.tagLine}`,
      })

      const embed = new EmbedBuilder()
        .setTitle(embedData.title || null)
        .setDescription(embedData.description || null)
        .setColor(embedData.color || 0x5865f2)

      if (embedData.footer) {
        embed.setFooter({ text: embedData.footer.text })
      }

      if (embedData.timestamp) {
        embed.setTimestamp(embedData.timestamp)
      }

      // Send to tracker channel
      if (!botClient) {
        console.warn('[GameTracker] Bot client not available')
        return
      }

      try {
        const channel = await botClient.channels.fetch(trackerChannelId)
        if (!channel || !channel.isTextBased() || !('send' in channel)) {
          console.error('[GameTracker] Tracker channel not found or not text-based')
          return
        }

        await channel.send({ embeds: [embed] })
        console.log(`[GameTracker] Game started notification sent for duo ${duo.name}`)
      } catch (error) {
        console.error('[GameTracker] Error sending game started notification:', error)
      }
      break
    }

    case 'GAME_RESULT_FOUND': {
      // Automatic scoring when game result is found
      console.log(`[GameTracker] Game result found for duo ${event.duoId}: ${event.matchData.metadata.matchId}`)

      const duo = state.duos.get(Number(event.duoId))
      if (!duo) {
        console.warn(`[GameTracker] Duo ${event.duoId} not found for GAME_RESULT_FOUND event`)
        return
      }

      const noob = state.players.get(duo.noobId)
      const carry = state.players.get(duo.carryId)
      if (!noob || !carry) {
        console.warn(`[GameTracker] Players not found for duo ${event.duoId}`)
        return
      }

      // Find player data in match
      const matchInfo = event.matchData.info
      const noobData = matchInfo.participants.find((p) => p.puuid === noob.puuid)
      const carryData = matchInfo.participants.find((p) => p.puuid === carry.puuid)

      if (!noobData || !carryData) {
        console.warn(`[GameTracker] Player data not found in match for duo ${event.duoId}`)
        return
      }

      // Verify same team
      if (noobData.teamId !== carryData.teamId) {
        console.log(`[GameTracker] Players not on same team in match ${event.matchData.metadata.matchId}`)
        return
      }

      // Import scoring engine
      const { calculateGameScore } = await import('../services/scoring/engine.js')

      // Helper: Convert user-friendly role to Riot API lane
      const roleToLane = (role: string): string => {
        const mapping: Record<string, string> = {
          'TOP': 'TOP',
          'JUNGLE': 'JUNGLE',
          'MID': 'MIDDLE',
          'ADC': 'BOTTOM',
          'SUPPORT': 'UTILITY'
        }
        return mapping[role.toUpperCase()] || role
      }

      // Fetch current ranks from Riot API
      let noobNewRank = noob.currentRank
      let carryNewRank = carry.currentRank

      if (state.riotService) {
        try {
          const [noobRank, carryRank] = await Promise.all([
            state.riotService.getRankBySummonerId(noobData.summonerId),
            state.riotService.getRankBySummonerId(carryData.summonerId),
          ])

          // Use fetched ranks if available, fallback to current rank
          if (noobRank) noobNewRank = noobRank
          if (carryRank) carryNewRank = carryRank
        } catch (error) {
          console.warn('[GameTracker] Failed to fetch ranks, using current ranks as fallback:', error)
        }
      }

      // Create GameData with real rank changes
      const gameData = {
        matchId: event.matchData.metadata.matchId,
        gameId: matchInfo.gameId,
        startTime: new Date(matchInfo.gameStartTimestamp),
        endTime: new Date(matchInfo.gameEndTimestamp),
        duration: matchInfo.gameDuration,
        duoId: duo.id,
        win: noobData.win,
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
          isOffRole: noob.mainRoleString ? roleToLane(noob.mainRoleString) !== noobData.teamPosition : false,
          isOffChampion: noob.mainChampion ? noob.mainChampion !== noobData.championName : false
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
          isOffRole: carry.mainRoleString ? roleToLane(carry.mainRoleString) !== carryData.teamPosition : false,
          isOffChampion: carry.mainChampion ? carry.mainChampion !== carryData.championName : false,
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

      // Update current ranks with fetched ranks
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

      // Update duo
      duo.totalPoints += duoPoints
      duo.gamesPlayed += 1
      duo.lastGameAt = new Date()

      // Mark game as scored in state.games and update pointsAwarded
      const trackedGame = state.games.get(event.matchData.metadata.matchId)
      if (trackedGame) {
        trackedGame.scored = true
        trackedGame.pointsAwarded = duoPoints
      }

      // Send notification to tracker channel
      const trackerChannelId =
        typeof state.config === 'object' && 'getSync' in state.config
          ? state.config.getSync('trackerChannelId')
          : (state.config as any).trackerChannelId

      if (trackerChannelId && botClient) {
        try {
          const { formatGameScored } = await import('../formatters/embeds.js')
          const { EmbedBuilder } = await import('discord.js')

          const embed = formatGameScored({
            win: gameData.win,
            noobName: `${noob.gameName}#${noob.tagLine}`,
            carryName: `${carry.gameName}#${carry.tagLine}`,
            noobKDA: `${noobData.kills}/${noobData.deaths}/${noobData.assists}`,
            carryKDA: `${carryData.kills}/${carryData.deaths}/${carryData.assists}`,
            noobPoints,
            carryPoints,
            totalPoints: duoPoints,
            duration: matchInfo.gameDuration,
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

          const channel = await botClient.channels.fetch(trackerChannelId)
          if (channel && channel.isTextBased() && 'send' in channel) {
            await channel.send({ embeds: [embedBuilder] })
            console.log(`[GameTracker] Automatic scoring completed for duo ${duo.name}: ${duoPoints} pts`)
          }
        } catch (error) {
          console.error('[GameTracker] Error sending scoring notification:', error)
        }
      }

      break
    }

    case 'GAME_RESULT_TIMEOUT': {
      console.warn(`[GameTracker] Game result timeout for duo ${event.duoId}, match ${event.matchId}`)
      break
    }

    case 'ERROR': {
      console.error(`[GameTracker] Error for duo ${event.duoId}:`, event.error)
      break
    }
  }
}
*/

/**
 * Create and configure Discord bot client
 */
export function createBot(config: BotConfig): BotClient {
  // Create client with required intents
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  }) as BotClient

  // Initialize commands map
  client.commands = new Collection()

  // Register all commands
  const commands: CommandDefinition[] = [
    // Auth
    registerCommand,
    unregisterCommand,
    linkCommand,
    // Game
    pollCommand,
    // Stats
    ladderCommand,
    profileCommand,
    historyCommand,
    // Admin
    setupCommand,
    testCommand,
    // Dev
    devCommand,
    keyCommand,
  ]

  for (const command of commands) {
    client.commands.set(command.data.name, command)
  }

  // Register event handlers
  ready(client)
  interactionCreate(client)

  return client
}

/**
 * Start the Discord bot
 */
export async function startBot(config: BotConfig): Promise<BotClient> {
  const client = createBot(config)

  // Login to Discord
  await client.login(config.token)

  // Store client globally for GameTracker event handler
  botClient = client

  // Get state from router
  const state = router.getState()

  // Start Daily Ladder Service (posts at 19:00 Europe/Paris)
  dailyLadderService = new DailyLadderService(client, state)
  dailyLadderService.start()

  // Start API Key Reminder Service (checks every hour)
  apiKeyReminderService = new ApiKeyReminderService(client, state)
  apiKeyReminderService.start()

  // NOTE: GameTracker automatic detection removed
  // Riot API no longer supports real-time game detection
  // Use /poll command for manual game detection instead

  return client
}

/**
 * Stop the Discord bot
 */
export async function stopBot(client: BotClient): Promise<void> {
  // Stop Daily Ladder Service
  if (dailyLadderService) {
    dailyLadderService.stop()
    dailyLadderService = null
  }

  // Stop API Key Reminder Service
  if (apiKeyReminderService) {
    apiKeyReminderService.stop()
    apiKeyReminderService = null
  }

  // NOTE: GameTracker removed - no longer needed

  // Clear bot client
  botClient = null

  await client.destroy()
  console.log('[Bot] Disconnected')
}
