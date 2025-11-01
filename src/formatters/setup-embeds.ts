/**
 * Setup Embed Formatters
 *
 * Provides embed formatters for /setup command responses
 */

import { successEmbed, errorEmbed, infoEmbed, type EmbedField, Colors } from './base-embeds'

/**
 * Setup Channels Success Embed
 *
 * @param generalChannelId - ID of general channel
 * @param trackerChannelId - ID of tracker channel
 * @returns Formatted embed
 */
export function setupChannelsSuccessEmbed(
  generalChannelId: string,
  trackerChannelId: string
): string {
  return successEmbed(
    'Channels configurés',
    `Les channels Discord ont été configurés avec succès.`,
    [
      {
        name: '💬 Channel Général',
        value: `<#${generalChannelId}>\nInteractions avec les joueurs`,
        inline: true,
      },
      {
        name: '📊 Channel Tracker',
        value: `<#${trackerChannelId}>\nNotifications automatiques`,
        inline: true,
      },
    ]
  )
}

/**
 * Setup Event Success Embed
 *
 * @param startDate - Event start date (ISO string)
 * @param endDate - Event end date (ISO string)
 * @param timezone - Timezone
 * @param durationDays - Duration in days
 * @param durationHours - Remaining hours
 * @returns Formatted embed
 */
export function setupEventSuccessEmbed(
  startDate: string,
  endDate: string,
  timezone: string,
  durationDays: number,
  durationHours: number
): string {
  const startFormatted = new Date(startDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })

  const endFormatted = new Date(endDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  })

  let durationText = ''
  if (durationDays > 0) {
    durationText = `${durationDays} jour${durationDays > 1 ? 's' : ''}`
  }
  if (durationHours > 0) {
    if (durationText) durationText += ' et '
    durationText += `${durationHours} heure${durationHours > 1 ? 's' : ''}`
  }

  return successEmbed(
    'Événement configuré',
    `Les dates de l'événement ont été configurées.`,
    [
      {
        name: '📅 Début',
        value: startFormatted,
        inline: true,
      },
      {
        name: '📅 Fin',
        value: endFormatted,
        inline: true,
      },
      {
        name: '🌍 Fuseau horaire',
        value: timezone,
        inline: true,
      },
      {
        name: '⏱️ Durée',
        value: durationText || 'Moins d\'1 heure',
        inline: false,
      },
    ]
  )
}

/**
 * Setup Status Embed
 *
 * @param generalChannelId - ID of general channel (or null)
 * @param trackerChannelId - ID of tracker channel (or null)
 * @param eventStartDate - Event start date (or null)
 * @param eventEndDate - Event end date (or null)
 * @param eventTimezone - Event timezone
 * @param riotApiKey - Riot API key status
 * @param isEventActive - Whether event is currently active
 * @param playerCount - Number of registered players
 * @param duoCount - Number of active duos
 * @param gameCount - Number of tracked games
 * @returns Formatted embed
 */
export function setupStatusEmbed(
  generalChannelId: string | null,
  trackerChannelId: string | null,
  eventStartDate: string | null,
  eventEndDate: string | null,
  eventTimezone: string | null,
  riotApiKey: string | null,
  isEventActive: boolean,
  playerCount: number,
  duoCount: number,
  gameCount: number
): string {
  const fields: EmbedField[] = []

  // Channels section
  let channelsValue = ''
  if (generalChannelId && trackerChannelId) {
    channelsValue = `💬 Général: <#${generalChannelId}>\n📊 Tracker: <#${trackerChannelId}>`
  } else {
    channelsValue = '❌ Non configurés\nUtilise `/setup channels`'
  }
  fields.push({
    name: '📡 Channels Discord',
    value: channelsValue,
    inline: false,
  })

  // Event section
  let eventValue = ''
  if (eventStartDate && eventEndDate) {
    const startFormatted = new Date(eventStartDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: eventTimezone || 'Europe/Paris',
    })
    const endFormatted = new Date(eventEndDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: eventTimezone || 'Europe/Paris',
    })

    const statusEmoji = isEventActive ? '🟢' : '⏳'
    const statusText = isEventActive ? 'Actif' : 'Pas encore commencé'

    eventValue = `${statusEmoji} **${statusText}**\n📅 ${startFormatted} → ${endFormatted}\n🌍 ${eventTimezone || 'Europe/Paris'}`
  } else {
    eventValue = '❌ Non configuré\nUtilise `/setup event`'
  }
  fields.push({
    name: '🎮 Événement DUOQ',
    value: eventValue,
    inline: false,
  })

  // Stats section
  fields.push({
    name: '📊 Statistiques',
    value: `👥 ${playerCount} joueur${playerCount > 1 ? 's' : ''}\n🤝 ${duoCount} duo${duoCount > 1 ? 's' : ''}\n🎯 ${gameCount} game${gameCount > 1 ? 's' : ''}`,
    inline: true,
  })

  // API Key section
  const apiKeyValue = riotApiKey ? '✅ Configurée' : '❌ Non configurée'
  fields.push({
    name: '🔑 Clé API Riot',
    value: apiKeyValue,
    inline: true,
  })

  // Description based on completeness
  const isComplete = generalChannelId && trackerChannelId && eventStartDate && eventEndDate && riotApiKey
  const description = isComplete
    ? '✅ Le bot est **entièrement configuré** et prêt à l\'emploi.'
    : '⚠️ Configuration **incomplète**. Utilise les commandes `/setup` pour configurer le bot.'

  return JSON.stringify({
    title: '⚙️ Configuration du Bot',
    description,
    color: isComplete ? Colors.SUCCESS : Colors.WARNING,
    fields,
    footer: {
      text: 'DuoQ Tracker Bot • Version 1.0',
    },
  })
}

/**
 * Setup Reset Success Embed
 *
 * @param playerCount - Number of players deleted
 * @param duoCount - Number of duos deleted
 * @param gameCount - Number of games deleted
 * @param devCount - Number of devs deleted
 * @param preserved - List of preserved items
 * @returns Formatted embed
 */
export function setupResetSuccessEmbed(
  playerCount: number,
  duoCount: number,
  gameCount: number,
  devCount: number,
  preserved: string[]
): string {
  const fields: EmbedField[] = [
    {
      name: '🗑️ Données supprimées',
      value: `${playerCount} joueur${playerCount > 1 ? 's' : ''}\n${duoCount} duo${duoCount > 1 ? 's' : ''}\n${gameCount} game${gameCount > 1 ? 's' : ''}\n${devCount} dev${devCount > 1 ? 's' : ''}`,
      inline: true,
    },
  ]

  if (preserved.length > 0) {
    fields.push({
      name: '✅ Conservé',
      value: preserved.join('\n'),
      inline: true,
    })
  }

  return JSON.stringify({
    title: '🔄 Données réinitialisées',
    description: 'Toutes les données de l\'événement ont été supprimées.',
    color: Colors.WARNING,
    fields,
    footer: {
      text: 'Le bot a été réinitialisé aux valeurs par défaut',
    },
  })
}

/**
 * Setup Reset Confirmation Required Embed
 *
 * @returns Formatted embed
 */
export function setupResetConfirmationEmbed(): string {
  return errorEmbed(
    'Confirmation requise',
    `⚠️ **ATTENTION** : Cette action est **destructive et irréversible**.

Cela supprimera :
• Tous les joueurs inscrits
• Tous les duos formés
• Toutes les games trackées
• Tous les développeurs notifiés

Conservera :
• Configuration des channels
• Dates de l'événement
• Clé API Riot

Pour confirmer, utilise :
\`\`\`
/setup reset confirm:true
\`\`\``
  )
}

/**
 * Setup Channels Error - Identical Channels
 *
 * @returns Formatted embed
 */
export function setupChannelsIdenticalErrorEmbed(): string {
  return errorEmbed(
    'Channels identiques',
    'Les channels général et tracker doivent être **différents**.\n\nUtilise deux channels distincts pour séparer les interactions utilisateurs et les notifications automatiques.'
  )
}

/**
 * Setup Event Error - Invalid Dates
 *
 * @param reason - Error reason
 * @returns Formatted embed
 */
export function setupEventErrorEmbed(reason: string): string {
  return errorEmbed(
    'Dates invalides',
    `❌ ${reason}\n\nFormat requis : **ISO 8601**\nExemple : \`2025-11-01T00:00:00Z\``
  )
}

/**
 * Setup Event Warning - Past Date
 *
 * @returns Formatted embed
 */
export function setupEventPastDateWarningEmbed(): string {
  return JSON.stringify({
    title: '⚠️ Attention',
    description: 'La date de fin est dans le **passé**.\n\nL\'événement sera considéré comme terminé.',
    color: Colors.WARNING,
  })
}
