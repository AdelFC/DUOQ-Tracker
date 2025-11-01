/**
 * Start the Discord Bot
 *
 * Run with: npm start
 */

import * as dotenv from 'dotenv'
import { startBot } from './bot/index.js'

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

// Start the bot
startBot({
  token: TOKEN,
  clientId: CLIENT_ID,
})
  .then(() => {
    console.log('[Start] Bot started successfully!')
  })
  .catch((error) => {
    console.error('[Start] Failed to start bot:', error)
    process.exit(1)
  })

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('[Start] Shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[Start] Shutting down...')
  process.exit(0)
})
