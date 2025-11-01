/**
 * /history command
 *
 * View game history for a duo
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const historyCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Voir l\'historique des parties d\'un duo')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Numéro de page (défaut: 1)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
