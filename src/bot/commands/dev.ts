/**
 * /dev command
 *
 * Development/admin commands (reset state, etc.)
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const devCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('[DEV] Commandes de développement')
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('Action à effectuer')
        .setRequired(true)
        .addChoices(
          { name: 'reset', value: 'reset' },
          { name: 'status', value: 'status' },
          { name: 'dump', value: 'dump' }
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
