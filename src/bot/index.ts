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
import { router } from './router.js'

// Global Daily Ladder Service instance
let dailyLadderService: DailyLadderService | null = null

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

  // Start Daily Ladder Service (posts at 19:00 Europe/Paris)
  dailyLadderService = new DailyLadderService(client, router['state'])
  dailyLadderService.start()

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

  await client.destroy()
  console.log('[Bot] Disconnected')
}
