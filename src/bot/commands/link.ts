/**
 * /link command
 *
 * Link Riot account individually with main role, champion, and peak elo
 */

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const linkCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Créer un duo avec votre partenaire')
    .addUserOption((option) =>
      option
        .setName('partenaire')
        .setDescription('Votre partenaire de duo (@mention)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('team_name')
        .setDescription('Nom de votre équipe (optionnel, généré automatiquement si vide)')
        .setRequired(false)
    ) as SlashCommandBuilder,

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
