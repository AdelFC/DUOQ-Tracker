/**
 * Discord Slash Command Definitions
 *
 * Defines all slash commands for the DUOQ Tracker bot
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js'

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
    .setDescription('[DEV] Vérifier manuellement les games actives')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
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
        .addChannelOption((option) =>
          option
            .setName('dev')
            .setDescription('Channel pour les logs de scoring détaillés')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('event')
        .setDescription('Configurer les dates de l\'événement')
        .addStringOption((option) =>
          option
            .setName('start-date')
            .setDescription('Date de début (format: 1/11/2025)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('start-h')
            .setDescription('Heure de début (format: 20:00)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('end-date')
            .setDescription('Date de fin (format: 30/11/2025)')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('end-h')
            .setDescription('Heure de fin (format: 23:59)')
            .setRequired(true)
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
    .setDescription('[ADMIN] Tester toutes les commandes du bot avec des données mock')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
}

/**
 * /add-points - Ajouter/retirer des points à un duo (admin)
 */
export const addPointsCommand = {
  data: new SlashCommandBuilder()
    .setName('add-points')
    .setDescription('[ADMIN] Ajouter ou retirer des points à un duo')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName('team_name')
        .setDescription('Nom de l\'équipe duo')
        .setRequired(true)
        .setAutocomplete(true)
    )
    .addIntegerOption((option) =>
      option
        .setName('points')
        .setDescription('Nombre de points à ajouter (négatif pour retirer)')
        .setRequired(true)
    ),
}

/**
 * /admin - Commandes admin temporaires (À SUPPRIMER après usage)
 */
export const adminCommand = {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('[ADMIN TEMP] Commandes de maintenance temporaire')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set-initial-rank')
        .setDescription('Corriger l\'initialRank d\'un joueur (temporaire)')
        .addUserOption((option) =>
          option
            .setName('joueur')
            .setDescription('Le joueur à corriger')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('rank')
            .setDescription('Rang initial (ex: G2, P4, D1, M, GM, C)')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('recalculate')
        .setDescription('Re-poll et recalcule tous les scores depuis une date avec v3.0')
        .addStringOption((option) =>
          option
            .setName('start-date')
            .setDescription('Date de début (format: 14/11/2024) - défaut: 14/11/2024')
            .setRequired(false)
        )
        .addStringOption((option) =>
          option
            .setName('team')
            .setDescription('Nom de la team (optionnel, si vide = tous les duos)')
            .setRequired(false)
        )
    ),
}
