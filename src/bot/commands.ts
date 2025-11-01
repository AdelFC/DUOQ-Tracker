/**
 * Discord Slash Command Definitions
 *
 * Defines all slash commands for the DUOQ Tracker bot
 */

import { SlashCommandBuilder } from 'discord.js'

/**
 * /register - S'inscrire au challenge
 */
export const registerCommand = {
  data: new SlashCommandBuilder()
    .setName('register')
    .setDescription('S\'inscrire au challenge DUOQ')
    .addStringOption((option) =>
      option
        .setName('riot_id')
        .setDescription('Ton Riot ID (ex: Faker#KR1)')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('main_role')
        .setDescription('Ton rôle principal')
        .setRequired(true)
        .addChoices(
          { name: 'Top', value: 'top' },
          { name: 'Jungle', value: 'jungle' },
          { name: 'Mid', value: 'mid' },
          { name: 'ADC', value: 'adc' },
          { name: 'Support', value: 'support' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('main_champion')
        .setDescription('Ton champion principal')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('peak_elo')
        .setDescription('Ton meilleur elo atteint')
        .setRequired(true)
        .addChoices(
          { name: 'Iron', value: 'Iron' },
          { name: 'Bronze', value: 'Bronze' },
          { name: 'Silver', value: 'Silver' },
          { name: 'Gold', value: 'Gold' },
          { name: 'Platinum', value: 'Platinum' },
          { name: 'Emerald', value: 'Emerald' },
          { name: 'Diamond', value: 'Diamond' },
          { name: 'Master', value: 'Master' },
          { name: 'Grandmaster', value: 'Grandmaster' },
          { name: 'Challenger', value: 'Challenger' }
        )
    ),
}

/**
 * /unregister - Se désinscrire du challenge
 */
export const unregisterCommand = {
  data: new SlashCommandBuilder()
    .setName('unregister')
    .setDescription('Se désinscrire du challenge DUOQ'),
}

/**
 * /link - Lier un duo
 */
export const linkCommand = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Former un duo avec un autre joueur')
    .addUserOption((option) =>
      option
        .setName('partenaire')
        .setDescription('Ton partenaire de duo')
        .setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('team_name').setDescription('Nom de votre équipe (optionnel)')
    ),
}

/**
 * /poll - Vérifier les games actives (dev/admin)
 */
export const pollCommand = {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('[DEV] Vérifier manuellement les games actives'),
}

/**
 * /end - Terminer une game manuellement (dev/admin)
 */
export const endCommand = {
  data: new SlashCommandBuilder()
    .setName('end')
    .setDescription('[DEV] Terminer une game manuellement')
    .addStringOption((option) =>
      option.setName('game_id').setDescription('ID de la game').setRequired(true)
    ),
}

/**
 * /ladder - Afficher le classement
 */
export const ladderCommand = {
  data: new SlashCommandBuilder()
    .setName('ladder')
    .setDescription('Afficher le classement des duos')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Numéro de page').setMinValue(1)
    ),
}

/**
 * /profile - Afficher le profil d'un joueur
 */
export const profileCommand = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('Afficher le profil d\'un joueur')
    .addUserOption((option) =>
      option.setName('joueur').setDescription('Le joueur à afficher (toi par défaut)')
    ),
}

/**
 * /history - Afficher l'historique des games
 */
export const historyCommand = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Afficher l\'historique de tes games')
    .addIntegerOption((option) =>
      option.setName('page').setDescription('Numéro de page').setMinValue(1)
    ),
}

/**
 * /dev - Commandes de développement
 */
export const devCommand = {
  data: new SlashCommandBuilder()
    .setName('dev')
    .setDescription('[DEV] Commandes de développement')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription('Ajouter un développeur à notifier pour les resets de clé API')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Le développeur à ajouter')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Retirer un développeur de la liste de notification')
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Le développeur à retirer')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('Lister tous les développeurs notifiés')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Vérifier le statut du bot')
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('reset').setDescription('Réinitialiser le bot')
    ),
}

/**
 * /key - Gérer les clés API Riot
 */
export const keyCommand = {
  data: new SlashCommandBuilder()
    .setName('key')
    .setDescription('[DEV] Gérer les clés API Riot')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Définir une clé API Riot')
        .addStringOption((option) =>
          option.setName('key').setDescription('La clé API').setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('show').setDescription('Afficher la clé API actuelle')
    ),
}

/**
 * /setup - Commandes de configuration (admin)
 */
export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('[ADMIN] Configurer le challenge DUOQ')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('channels')
        .setDescription('Configurer les channels Discord')
        .addChannelOption((option) =>
          option
            .setName('general')
            .setDescription('Channel pour les interactions générales')
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('tracker')
            .setDescription('Channel pour les notifications automatiques')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('event')
        .setDescription('Configurer les dates de l\'événement')
        .addStringOption((option) =>
          option
            .setName('start')
            .setDescription('Date de début (ISO 8601: 2025-11-01T00:00:00Z)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('end')
            .setDescription('Date de fin (ISO 8601: 2025-11-30T23:59:59Z)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('timezone')
            .setDescription('Fuseau horaire (ex: Europe/Paris)')
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName('status').setDescription('Afficher la configuration actuelle')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription('Réinitialiser les données de l\'événement')
        .addBooleanOption((option) =>
          option
            .setName('confirm')
            .setDescription('Confirmer la réinitialisation (ATTENTION: irréversible)')
            .setRequired(true)
        )
    ),
}

/**
 * /test - Tester toutes les commandes avec des données mock (admin)
 */
export const testCommand = {
  data: new SlashCommandBuilder()
    .setName('test')
    .setDescription('[ADMIN] Tester toutes les commandes du bot avec des données mock'),
}
