/**
 * Start the Discord Bot
 *
 * Run with: npm start
 */

import * as dotenv from 'dotenv'
import { startBot, stopBot } from './bot/index.js'
import type { BotClient } from './bot/types.js'

// Load environment variables
dotenv.config()

const TOKEN = process.env.DISCORD_TOKEN
const CLIENT_ID = process.env.DISCORD_CLIENT_ID

if (!TOKEN) {
  console.error('❌ Missing DISCORD_TOKEN in .env')
  process.exit(1)
}

if (!CLIENT_ID) {
  console.error('❌ Missing DISCORD_CLIENT_ID in .env')
  process.exit(1)
}

console.log('[Start] Starting Discord bot...')
console.log(`[Start] Client ID: ${CLIENT_ID}`)

// Store bot client for graceful shutdown
let botClient: BotClient | null = null

// Start the bot
startBot({
  token: TOKEN,
  clientId: CLIENT_ID,
})
  .then((client) => {
    botClient = client
    console.log('[Start] Bot started successfully!')
  })
  .catch((error) => {
    console.error('[Start] Failed to start bot:', error)
    process.exit(1)
  })

// Handle graceful shutdown
const handleShutdown = async (signal: string) => {
  console.log(`[Start] Received ${signal}, shutting down gracefully...`)

  if (botClient) {
    try {
      await stopBot(botClient)
      console.log('[Start] Bot stopped successfully')
      process.exit(0)
    } catch (error) {
      console.error('[Start] Error during shutdown:', error)
      process.exit(1)
    }
  } else {
    process.exit(0)
  }
}

process.on('SIGINT', () => handleShutdown('SIGINT'))
process.on('SIGTERM', () => handleShutdown('SIGTERM'))
