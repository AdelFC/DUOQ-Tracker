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
import { PersistenceService } from '../services/persistence.service.js'
import { router } from './router.js'
import { initDiscordLogger } from '../utils/discord-logger.js'

// Global service instances
let dailyLadderService: DailyLadderService | null = null
let apiKeyReminderService: ApiKeyReminderService | null = null
let autoPollService: AutoPollService | null = null
let challengeEndService: ChallengeEndService | null = null
let persistenceService: PersistenceService | null = null
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
  // Get state from router
  const state = router.getState()

  // Initialize Persistence Service and load saved state
  persistenceService = new PersistenceService(state)
  const hasLoadedState = await persistenceService.load()

  if (hasLoadedState) {
    console.log('[Bot] Loaded saved state from disk')
  } else {
    console.log('[Bot] Starting with fresh state')
  }

  // Start auto-save (every 5 minutes)
  persistenceService.start()
  console.log('[Bot] Persistence service started (auto-save every 5min)')

  const client = createBot(config)

  // Login to Discord
  await client.login(config.token)

  // Store client globally for service access
  botClient = client

  // Initialize Discord Logger (for error/warning notifications)
  initDiscordLogger(client, state)
  console.log('[Bot] Discord logger initialized')

  // Start Daily Ladder Service (posts at 19:00 Europe/Paris)
  dailyLadderService = new DailyLadderService(client, state)
  dailyLadderService.start()

  // Start API Key Reminder Service (checks every hour)
  apiKeyReminderService = new ApiKeyReminderService(client, state)
  apiKeyReminderService.start()

  // Start Auto Poll Service (automatic game detection with tiered intervals)
  // Interval adjusts automatically based on number of duos:
  // - 1-4 duos: 30s
  // - 5-8 duos: 45s
  // - 9-12 duos: 60s
  // - 13-16 duos: 90s
  // - 17-20 duos: 120s
  // - 21+ duos: scales linearly
  if (state.riotService) {
    autoPollService = new AutoPollService(
      client,
      state,
      state.riotService
    )
    autoPollService.start()
    console.log('[Bot] AutoPoll service started with dynamic interval')
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
  // Save state before stopping
  if (persistenceService) {
    console.log('[Bot] Saving state before shutdown...')
    await persistenceService.forceSave()
    persistenceService.stop()
    persistenceService = null
  }

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
