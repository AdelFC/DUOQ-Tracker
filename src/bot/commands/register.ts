/**
 * /register command
 *
 * Create a duo with your partner (both must be linked first with /link)
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const registerCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('Créer un duo avec votre partenaire (vous devez tous les deux avoir fait /link)')
    .addUserOption((option) =>
      option
        .setName('partenaire')
        .setDescription('Votre partenaire de duo (@mention)')
        .setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
