/**
 * /profile command
 *
 * View a player's profile and stats
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const profileCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Voir le profil d\'un joueur')
    .addUserOption((option) =>
      option
        .setName('joueur')
        .setDescription('Le joueur à afficher (défaut: vous-même)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
