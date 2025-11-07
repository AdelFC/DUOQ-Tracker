/**
 * Discord Logger Utility
 *
 * Envoie les logs (erreurs, warnings, infos) vers le channel dev Discord
 * Permet de monitorer le bot en temps réel sans SSH
 */

import type { Client, TextChannel } from 'discord.js'
import type { State } from '../types/state.js'

export type LogLevel = 'error' | 'warn' | 'info'

interface LoggerConfig {
  client: Client | null
  state: State | null
}

const config: LoggerConfig = {
  client: null,
  state: null,
}

/**
 * Initialize the Discord logger with client and state
 * Call this after bot is ready
 */
export function initDiscordLogger(client: Client, state: State): void {
  config.client = client
  config.state = state
}

/**
 * Log an error to Discord dev channel
 */
export async function logError(message: string, error?: Error | unknown): Promise<void> {
  await sendToDiscord('error', message, error)
}

/**
 * Log a warning to Discord dev channel
 */
export async function logWarn(message: string, details?: string): Promise<void> {
  await sendToDiscord('warn', message, details)
}

/**
 * Log info to Discord dev channel
 */
export async function logInfo(message: string, details?: string): Promise<void> {
  await sendToDiscord('info', message, details)
}

/**
 * Internal function to send logs to Discord
 */
async function sendToDiscord(
  level: LogLevel,
  message: string,
  extra?: Error | unknown | string
): Promise<void> {
  // Always log to console first
  const consoleMessage = `[${level.toUpperCase()}] ${message}`
  if (level === 'error') {
    console.error(consoleMessage, extra || '')
  } else if (level === 'warn') {
    console.warn(consoleMessage, extra || '')
  } else {
    console.log(consoleMessage, extra || '')
  }

  // Send to Discord if configured
  if (!config.client || !config.state) {
    return
  }

  try {
    const devChannelId =
      typeof config.state.config === 'object' && 'getSync' in config.state.config
        ? config.state.config.getSync('devChannelId')
        : (config.state.config as any)?.devChannelId

    if (!devChannelId) {
      return // No dev channel configured
    }

    const channel = await config.client.channels.fetch(devChannelId)
    if (!channel || !channel.isTextBased()) {
      return
    }

    // Format message with emoji and timestamp
    const emoji = level === 'error' ? '🔴' : level === 'warn' ? '⚠️' : 'ℹ️'
    const timestamp = new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })

    let content = `${emoji} **[${level.toUpperCase()}]** \`${timestamp}\`\n${message}`

    // Add extra details if provided
    if (extra) {
      if (extra instanceof Error) {
        content += `\n\`\`\`\n${extra.message}\n${extra.stack?.slice(0, 500) || ''}\n\`\`\``
      } else if (typeof extra === 'string') {
        content += `\n\`\`\`\n${extra.slice(0, 500)}\n\`\`\``
      } else {
        content += `\n\`\`\`json\n${JSON.stringify(extra, null, 2).slice(0, 500)}\n\`\`\``
      }
    }

    // Truncate if too long (Discord limit: 2000 chars)
    if (content.length > 1900) {
      content = content.slice(0, 1900) + '\n...\n```'
    }

    await (channel as TextChannel).send(content)
  } catch (err) {
    // Silent fail - don't crash the bot if Discord logging fails
    console.error('[DiscordLogger] Failed to send log to Discord:', err)
  }
}
