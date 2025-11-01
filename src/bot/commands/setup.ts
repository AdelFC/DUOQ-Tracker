/**
 * /setup command
 *
 * Configure the DuoQ Challenge (admin only)
 * Subcommands:
 * - /setup channels: Configure Discord channels
 * - /setup event: Configure event dates
 * - /setup status: Show current configuration
 * - /setup reset: Reset all challenge data
 */

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js'
import { CommandDefinition } from '../types'
import { router } from '../router'

export const setupCommand: CommandDefinition = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Configurer le Challenge DuoQ (admin uniquement)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('channels')
        .setDescription('Configurer les channels Discord pour les notifications')
        .addChannelOption((option) =>
          option
            .setName('general')
            .setDescription('Channel pour les commandes utilisateurs (register, profile, etc.)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('tracker')
            .setDescription('Channel pour les notifications de games et ladder')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('event')
        .setDescription("Configurer les dates de l'événement (timezone: Europe/Paris)")
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('Date de début (format ISO: 2025-11-01T00:00:00Z)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('Date de fin (format ISO: 2025-11-30T23:59:59Z)')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Afficher la configuration actuelle')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Réinitialiser toutes les données du challenge (⚠️ DESTRUCTIF)')
        .addBooleanOption((option) =>
          option
            .setName('confirm')
            .setDescription('Confirmer la réinitialisation (true pour confirmer)')
            .setRequired(false)
        )
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    await router.handleInteraction(interaction)
  },
}
