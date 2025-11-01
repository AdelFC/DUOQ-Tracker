/**
 * /end command
 *
 * Manually end a game (fallback if auto-detection fails)
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const endCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('end')
    .setDescription('Terminer manuellement une partie (fallback si détection auto échoue)')
    .addBooleanOption((option) =>
      option.setName('win').setDescription('Victoire (true) ou Défaite (false)').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('noob_kills').setDescription('Kills du noob').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('noob_deaths').setDescription('Morts du noob').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('noob_assists').setDescription('Assists du noob').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('carry_kills').setDescription('Kills du carry').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('carry_deaths').setDescription('Morts du carry').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('carry_assists').setDescription('Assists du carry').setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName('duration').setDescription('Durée en secondes').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
