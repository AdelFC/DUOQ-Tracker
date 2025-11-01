/**
 * Deploy Slash Commands to Discord
 *
 * Run with: npm run deploy
 */

import { REST, Routes } from 'discord.js'
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
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID
const GUILD_ID = process.env.DISCORD_GUILD_ID // Optional: for guild-specific commands

if (!TOKEN || !CLIENT_ID) {
  console.error('❌ Missing DISCORD_TOKEN or DISCORD_CLIENT_ID in .env')
  process.exit(1)
}

// Prepare commands for deployment
const commands = [
  // Auth
  registerCommand.data.toJSON(),
  unregisterCommand.data.toJSON(),
  linkCommand.data.toJSON(),
  // Game
  pollCommand.data.toJSON(),
  endCommand.data.toJSON(),
  // Stats
  ladderCommand.data.toJSON(),
  profileCommand.data.toJSON(),
  historyCommand.data.toJSON(),
  // Dev
  devCommand.data.toJSON(),
  keyCommand.data.toJSON(),
  // Admin
  setupCommand.data.toJSON(),
  testCommand.data.toJSON(),
]

// Create REST client
const rest = new REST().setToken(TOKEN)

async function deployCommands() {
  try {
    console.log(`[Deploy] Started refreshing ${commands.length} application (/) commands.`)

    if (GUILD_ID) {
      // Deploy to specific guild (faster, for development)
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      })
      console.log(`[Deploy] Successfully deployed ${commands.length} guild commands to ${GUILD_ID}`)
    } else {
      // Deploy globally (slower, 1 hour propagation)
      await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      })
      console.log(
        `[Deploy] Successfully deployed ${commands.length} global commands (1h propagation)`
      )
    }
  } catch (error) {
    console.error('[Deploy] Error deploying commands:', error)
    process.exit(1)
  }
}

// Run deployment
deployCommands()
