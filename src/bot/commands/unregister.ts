/**
 * /unregister command
 *
 * Unregister from current duo
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const unregisterCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Se désinscrire de votre duo actuel'),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
