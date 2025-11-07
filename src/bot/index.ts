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
import { AutoPollService } from '../services/auto-poll.service.js'
import { ChallengeEndService } from '../services/challenge-end.service.js'
import { router } from './router.js'
import { initDiscordLogger } from '../utils/discord-logger.js'

// Global service instances
let dailyLadderService: DailyLadderService | null = null
let apiKeyReminderService: ApiKeyReminderService | null = null
let autoPollService: AutoPollService | null = null
let challengeEndService: ChallengeEndService | null = null
let botClient: BotClient | null = null

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

  // Store client globally for service access
  botClient = client

  // Get state from router
  const state = router.getState()

  // Initialize Discord Logger (for error/warning notifications)
  initDiscordLogger(client, state)
  console.log('[Bot] Discord logger initialized')

  // Start Daily Ladder Service (posts at 19:00 Europe/Paris)
  dailyLadderService = new DailyLadderService(client, state)
  dailyLadderService.start()

  // Start API Key Reminder Service (checks every hour)
  apiKeyReminderService = new ApiKeyReminderService(client, state)
  apiKeyReminderService.start()

  // Start Auto Poll Service (automatic game detection every 15 seconds)
  if (state.riotService) {
    autoPollService = new AutoPollService(
      client,
      state,
      state.riotService,
      15000 // Poll every 15 seconds (rate limiting: 8 duos * 2 calls / 15s = ~64 calls/min < 100/2min limit)
    )
    autoPollService.start()
    console.log('[Bot] AutoPoll service started')
  } else {
    console.warn('[Bot] RiotService not available, AutoPoll not started')
  }

  // Start Challenge End Service (checks every hour)
  challengeEndService = new ChallengeEndService(client, state)
  challengeEndService.start()
  console.log('[Bot] ChallengeEnd service started')

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

  // Stop Auto Poll Service
  if (autoPollService) {
    autoPollService.stop()
    autoPollService = null
  }

  // Stop Challenge End Service
  if (challengeEndService) {
    challengeEndService.stop()
    challengeEndService = null
  }

  // Clear bot client
  botClient = null

  await client.destroy()
  console.log('[Bot] Disconnected')
}
