/**
 * /key command
 *
 * Manage Riot API keys (dev/admin only)
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const keyCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('key')
    .setDescription('[DEV] Gérer les clés API Riot')
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('Action à effectuer')
        .setRequired(true)
        .addChoices(
          { name: 'set', value: 'set' },
          { name: 'show', value: 'show' },
          { name: 'delete', value: 'delete' }
        )
    )
    .addStringOption((option) =>
      option.setName('api_key').setDescription('Clé API Riot (pour set)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
