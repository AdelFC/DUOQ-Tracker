/**
 * Discord Bot Types
 */

import {
  Client,
  CommandInteraction,
  SlashCommandBuilder,
  ChatInputCommandInteraction,
} from 'discord.js'

/**
 * Slash Command Definition
 */
export interface CommandDefinition {
  data: SlashCommandBuilder
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>
}

/**
 * Extended Discord Client with commands
 */
export interface BotClient extends Client {
  commands: Map<string, CommandDefinition>
}

/**
 * Bot Configuration
 */
export interface BotConfig {
  token: string
  clientId: string
  guildId?: string // Optional: for guild-specific commands (faster deployment)
}
