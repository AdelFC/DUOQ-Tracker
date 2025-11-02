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
  endCommand,
  ladderCommand,
  profileCommand,
  historyCommand,
  devCommand,
  keyCommand,
  setupCommand,
  testCommand,
} from './commands'
import { DailyLadderService } from '../services/daily-ladder.js'
import { GameTracker } from '../services/game-tracker/index.js'
import type { GameTrackerEvent } from '../services/game-tracker/types.js'
import type { Message } from '../types/message.js'
import { router } from './router.js'

// Global service instances
let dailyLadderService: DailyLadderService | null = null
let gameTracker: GameTracker | null = null
let botClient: BotClient | null = null

/**
 * Event handler for GameTracker events
 * Converts game tracking events into Discord notifications
 */
async function handleGameTrackerEvent(event: GameTrackerEvent, _messages: Message[]): Promise<void> {
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
      // TODO: Implement automatic scoring when result is found
      console.log(`[GameTracker] Game result found for duo ${event.duoId}: ${event.matchData.metadata.matchId}`)
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
    endCommand,
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

  // Start Game Tracker Service (automatic game detection)
  if (state.riotService) {
    gameTracker = new GameTracker(state.riotService, handleGameTrackerEvent, {
      pollingInterval: 10000, // 10 seconds
      minCheckInterval: 30000, // 30 seconds between checks for same duo
      maxConcurrentChecks: 5,
      maxFetchAttempts: 18, // 18 * 10s = 3 minutes
      region: 'euw1',
    })
    gameTracker.start()
    console.log('[Bot] GameTracker started')
  } else {
    console.warn('[Bot] RiotService not available, GameTracker not started')
  }

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

  // Stop Game Tracker Service
  if (gameTracker) {
    gameTracker.stop()
    gameTracker = null
    console.log('[Bot] GameTracker stopped')
  }

  // Clear bot client
  botClient = null

  await client.destroy()
  console.log('[Bot] Disconnected')
}

/**
 * Get GameTracker instance (for use in handlers)
 */
export function getGameTracker(): GameTracker | null {
  return gameTracker
}
