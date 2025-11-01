/**
 * /ladder command
 *
 * View the duo leaderboard
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const ladderCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('ladder')
    .setDescription('Voir le classement des duos')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Numéro de page (défaut: 1)').setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
