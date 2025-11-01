/**
 * /poll command
 *
 * Manually poll for a completed duo game
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const pollCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Vérifier manuellement si une partie duo est terminée'),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
