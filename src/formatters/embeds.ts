/**
 * Formatters pour les Discord Embeds
 * Inspiré du système de formatters du Pacte V2
 *
 * Transforme les données brutes en embeds Discord visuels et engageants
 */

import { COLORS, EMOJIS, getRankEmoji, getRankColor, getMotivationalFooter, getRandomTaunt, createProgressBar } from '../constants/lore.js'

/**
 * Interface pour un Discord Embed
 * Compatible avec discord.js EmbedBuilder
 */
export interface DiscordEmbed {
  title?: string
  description?: string
  color?: number
  fields?: Array<{ name: string; value: string; inline?: boolean }>
  footer?: { text: string; icon_url?: string }
  thumbnail?: { url: string }
  image?: { url: string }
  timestamp?: Date
}

// ============================================================================
// AUTH FORMATTERS
// ============================================================================

/**
 * Format : Inscription réussie
 */
export function formatRegisterSuccess(payload: {
  gameName: string
  tagLine: string
  role: 'noob' | 'carry'
  initialRank: string
}): DiscordEmbed {
  const { gameName, tagLine, role, initialRank } = payload
  const roleEmoji = role === 'noob' ? EMOJIS.noob : EMOJIS.carry
  const roleText = role === 'noob' ? 'Noob' : 'Carry'
  const rankEmoji = getRankEmoji(initialRank)

  return {
    title: `${EMOJIS.check} Inscription réussie !`,
    description: `Bienvenue dans le **DuoQ Tracker**, **${gameName}**#**${tagLine}** !\n\n${getRandomTaunt('welcome')}`,
    fields: [
      { name: 'Rôle', value: `${roleEmoji} **${roleText}**`, inline: true },
      { name: 'Rank Initial', value: `${rankEmoji} **${initialRank}**`, inline: true },
    ],
    color: COLORS.success,
    footer: { text: 'Prochaine étape : Utilise /link pour lier ton compte Riot !' },
    timestamp: new Date(),
  }
}

/**
 * Format : Erreur générique
 */
export function formatError(payload: { error?: string; reason?: string }): DiscordEmbed {
  const { error, reason } = payload

  return {
    title: `${EMOJIS.cross} Erreur`,
    description: error || reason || 'Une erreur est survenue.',
    color: COLORS.error,
    timestamp: new Date(),
  }
}

// ============================================================================
// GAME FORMATTERS
// ============================================================================

/**
 * Format : Game scorée
 */
export function formatGameScored(payload: {
  noobName: string
  carryName: string
  win: boolean
  noobPoints: number
  carryPoints: number
  noobKDA: string
  carryKDA: string
  duration: number
  totalPoints?: number
}): DiscordEmbed {
  const { noobName, carryName, win, noobPoints, carryPoints, noobKDA, carryKDA, duration, totalPoints } = payload

  const resultEmoji = win ? EMOJIS.victory : EMOJIS.defeat
  const resultText = win ? 'Victoire' : 'Défaite'
  const color = win ? COLORS.victory : COLORS.defeat
  const taunt = win ? getRandomTaunt('victory') : getRandomTaunt('defeat')

  const durationMin = Math.floor(duration / 60)
  const durationSec = duration % 60

  return {
    title: `${resultEmoji} ${resultText} !`,
    description: `**${noobName}** ${EMOJIS.duo} **${carryName}**\n\n${taunt}`,
    fields: [
      {
        name: `${EMOJIS.noob} ${noobName}`,
        value: `**${noobPoints > 0 ? '+' : ''}${noobPoints}** pts\nKDA: ${noobKDA}`,
        inline: true,
      },
      {
        name: `${EMOJIS.carry} ${carryName}`,
        value: `**${carryPoints > 0 ? '+' : ''}${carryPoints}** pts\nKDA: ${carryKDA}`,
        inline: true,
      },
      {
        name: 'Durée',
        value: `${EMOJIS.clock} ${durationMin}:${durationSec.toString().padStart(2, '0')}`,
        inline: true,
      },
    ],
    color,
    footer: totalPoints ? { text: `Total duo : ${totalPoints} pts` } : undefined,
    timestamp: new Date(),
  }
}

/**
 * Format : Win streak !
 */
export function formatWinStreak(payload: {
  noobName: string
  carryName: string
  streak: number
}): DiscordEmbed {
  const { noobName, carryName, streak } = payload

  return {
    title: `${EMOJIS.fire} WIN STREAK !`,
    description: `**${noobName}** ${EMOJIS.duo} **${carryName}**\n\n${getRandomTaunt('winStreak', { streak })}`,
    color: COLORS.streak,
    timestamp: new Date(),
  }
}

// ============================================================================
// STATS FORMATTERS
// ============================================================================

/**
 * Format : Profil d'un joueur
 */
export function formatPlayerProfile(payload: {
  gameName: string
  tagLine: string
  role: 'noob' | 'carry'
  currentRank: string
  initialRank: string
  totalPoints: number
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  bestStreak: number
  currentStreak: number
  duoPartner?: string
}): DiscordEmbed {
  const {
    gameName,
    tagLine,
    role,
    currentRank,
    initialRank,
    totalPoints,
    gamesPlayed,
    wins,
    losses,
    winRate,
    bestStreak,
    currentStreak,
    duoPartner,
  } = payload

  const roleEmoji = role === 'noob' ? EMOJIS.noob : EMOJIS.carry
  const roleText = role === 'noob' ? 'Noob' : 'Carry'
  const rankEmoji = getRankEmoji(currentRank)

  const streakText = currentStreak > 0
    ? `${EMOJIS.fire} +${currentStreak}`
    : currentStreak < 0
    ? `${EMOJIS.brokenHeart} ${currentStreak}`
    : '—'

  return {
    title: `${EMOJIS.scroll} Profil de ${gameName}#${tagLine}`,
    description: duoPartner ? `${roleEmoji} **${roleText}** • Duo avec **${duoPartner}**` : `${roleEmoji} **${roleText}**`,
    fields: [
      { name: 'Rank Actuel', value: `${rankEmoji} **${currentRank}**`, inline: true },
      { name: 'Rank Initial', value: `${getRankEmoji(initialRank)} ${initialRank}`, inline: true },
      { name: 'Points', value: `${EMOJIS.star} **${totalPoints}** pts`, inline: true },
      { name: 'Victoires', value: `${EMOJIS.trophy} ${wins}`, inline: true },
      { name: 'Défaites', value: `${EMOJIS.defeat} ${losses}`, inline: true },
      { name: 'Winrate', value: `${EMOJIS.chart} **${winRate}%**`, inline: true },
      { name: 'Games Jouées', value: `${EMOJIS.game} ${gamesPlayed}`, inline: true },
      { name: 'Meilleur Streak', value: `${EMOJIS.fire} ${bestStreak}`, inline: true },
      { name: 'Streak Actuel', value: streakText, inline: true },
    ],
    color: getRankColor(currentRank),
    footer: { text: getMotivationalFooter(winRate) },
    timestamp: new Date(),
  }
}

/**
 * Format : Stats d'un duo
 */
export function formatDuoStats(payload: {
  noobName: string
  carryName: string
  totalPoints: number
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
  bestStreak: number
  currentStreak: number
  noobRank: string
  carryRank: string
  noobPoints: number
  carryPoints: number
}): DiscordEmbed {
  const {
    noobName,
    carryName,
    totalPoints,
    gamesPlayed,
    wins,
    losses,
    winRate,
    bestStreak,
    currentStreak,
    noobRank,
    carryRank,
    noobPoints,
    carryPoints,
  } = payload

  const streakText = currentStreak > 0
    ? `${EMOJIS.fire} +${currentStreak} wins`
    : currentStreak < 0
    ? `${EMOJIS.brokenHeart} ${Math.abs(currentStreak)} losses`
    : 'Pas de streak'

  return {
    title: `${EMOJIS.duo} Stats du Duo`,
    description: `**${noobName}** ${EMOJIS.duo} **${carryName}**`,
    fields: [
      { name: 'Points Total', value: `${EMOJIS.star} **${totalPoints}** pts`, inline: true },
      { name: 'Games Jouées', value: `${EMOJIS.game} ${gamesPlayed}`, inline: true },
      { name: 'Winrate', value: `${EMOJIS.chart} **${winRate}%**`, inline: true },
      { name: 'Victoires', value: `${EMOJIS.trophy} ${wins}`, inline: true },
      { name: 'Défaites', value: `${EMOJIS.defeat} ${losses}`, inline: true },
      { name: 'Meilleur Streak', value: `${EMOJIS.fire} ${bestStreak}`, inline: true },
      { name: 'Streak Actuel', value: streakText, inline: false },
      {
        name: `${EMOJIS.noob} ${noobName}`,
        value: `${getRankEmoji(noobRank)} ${noobRank}\n${EMOJIS.star} ${noobPoints} pts`,
        inline: true,
      },
      {
        name: `${EMOJIS.carry} ${carryName}`,
        value: `${getRankEmoji(carryRank)} ${carryRank}\n${EMOJIS.star} ${carryPoints} pts`,
        inline: true,
      },
    ],
    color: COLORS.info,
    footer: { text: getMotivationalFooter(winRate) },
    timestamp: new Date(),
  }
}

/**
 * Format : Ladder (classement)
 */
export function formatLadder(payload: {
  duos: Array<{
    rank: number
    duoName: string
    noobName: string
    carryName: string
    totalPoints: number
    wins: number
    losses: number
  }>
  page: number
  totalPages: number
  totalDuos: number
  userDuoRank?: number
}): DiscordEmbed {
  const { duos, page, totalPages, totalDuos, userDuoRank } = payload

  const description = duos.length > 0
    ? duos
        .map((duo) => {
          const { rank, duoName, noobName, carryName, totalPoints, wins, losses } = duo
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`
          return `${medal} **${duoName}** • **${totalPoints}** pts (${wins}W/${losses}L)\n   └─ ${noobName} ${EMOJIS.duo} ${carryName}`
        })
        .join('\n\n')
    : 'Aucun duo classé'

  // Ajouter un taunt basé sur la position du duo du requester
  let taunt = ''
  if (userDuoRank && totalDuos > 0) {
    const percentile = userDuoRank / totalDuos
    if (userDuoRank <= 3) {
      // Top 3
      taunt = `\n\n${getRandomTaunt('ladderTrash')}`
    } else if (percentile <= 0.33) {
      // Top 33%
      taunt = `\n\n${getRandomTaunt('ladderTrash')}`
    } else if (percentile >= 0.67) {
      // Bottom 33%
      taunt = `\n\n${getRandomTaunt('ladderBottom')}`
    } else {
      // Middle 34%
      taunt = `\n\n${getRandomTaunt('ladderMiddle')}`
    }
  }

  const footerText = userDuoRank
    ? `Page ${page}/${totalPages} • ${totalDuos} duos • Votre rang : #${userDuoRank}`
    : `Page ${page}/${totalPages} • ${totalDuos} duos classés`

  return {
    title: `${EMOJIS.trophy} Classement DuoQ - Page ${page}/${totalPages}`,
    description: description + taunt,
    color: COLORS.legendary,
    footer: { text: footerText },
    timestamp: new Date(),
  }
}

/**
 * Format : Historique de games
 */
export function formatHistory(payload: {
  playerName: string
  games: Array<{
    win: boolean
    points: number
    kda: string
    championName: string
    date: Date
  }>
  page: number
  totalPages: number
}): DiscordEmbed {
  const { playerName, games, page, totalPages } = payload

  const description = games.length > 0
    ? games
        .map((game) => {
          const { win, points, kda, championName, date } = game
          const resultEmoji = win ? EMOJIS.win : EMOJIS.loss
          const pointsText = points > 0 ? `+${points}` : `${points}`
          const dateStr = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          return `${resultEmoji} **${pointsText}** pts • ${championName} • ${kda} • ${dateStr}`
        })
        .join('\n')
    : 'Aucune game dans l\'historique'

  return {
    title: `${EMOJIS.history} Historique de ${playerName}`,
    description,
    color: COLORS.info,
    footer: { text: `Page ${page}/${totalPages}` },
    timestamp: new Date(),
  }
}

/**
 * Format : Rank up/down
 */
export function formatRankChange(payload: {
  playerName: string
  oldRank: string
  newRank: string
  isPromotion: boolean
}): DiscordEmbed {
  const { playerName, oldRank, newRank, isPromotion } = payload

  const emoji = isPromotion ? EMOJIS.chart : EMOJIS.warning
  const title = isPromotion ? 'Promotion !' : 'Démotion...'
  const color = isPromotion ? COLORS.success : COLORS.warning
  const taunt = isPromotion
    ? getRandomTaunt('rankUp', { newRank })
    : getRandomTaunt('rankDown')

  return {
    title: `${emoji} ${title}`,
    description: `**${playerName}**\n\n${getRankEmoji(oldRank)} ${oldRank} → ${getRankEmoji(newRank)} **${newRank}**\n\n${taunt}`,
    color,
    timestamp: new Date(),
  }
}

// ============================================================================
// ADMIN FORMATTERS (SETUP)
// ============================================================================

/**
 * Format : /setup channels - Configuration des channels réussie
 */
export function formatSetupChannels(payload: {
  generalChannelId: string
  trackerChannelId: string
}): DiscordEmbed {
  const { generalChannelId, trackerChannelId } = payload
  const adminTaunt = getRandomTaunt('admin')

  return {
    title: `${EMOJIS.check} Channels configurés`,
    description: `${adminTaunt}\n\nLes channels Discord ont été configurés avec succès.`,
    fields: [
      {
        name: '💬 Channel General',
        value: `<#${generalChannelId}>\nInteractions et commandes`,
        inline: true,
      },
      {
        name: '📊 Channel Tracker',
        value: `<#${trackerChannelId}>\nNotifications automatiques`,
        inline: true,
      },
    ],
    color: COLORS.success,
    footer: { text: 'Messages de test envoyés dans les deux channels' },
    timestamp: new Date(),
  }
}

/**
 * Format : /setup event - Configuration de l'événement réussie
 */
export function formatSetupEvent(payload: {
  startDate: Date
  endDate: Date
  timezone: string
  durationDays: number
  durationHours: number
  isActive: boolean
}): DiscordEmbed {
  const { startDate, endDate, timezone, durationDays, durationHours, isActive } = payload
  const adminTaunt = getRandomTaunt('admin')

  const formatDate = (date: Date) => {
    return date.toLocaleString('fr-FR', {
      timeZone: timezone,
      dateStyle: 'full',
      timeStyle: 'short',
    })
  }

  const durationText = `${durationDays} jour${durationDays > 1 ? 's' : ''}${durationHours > 0 ? ` et ${durationHours} heure${durationHours > 1 ? 's' : ''}` : ''}`
  const statusText = isActive
    ? '🟢 L\'événement est maintenant **actif**. Que la compétition commence ! 🏆'
    : '⏳ L\'événement démarrera automatiquement à la date de début.'

  return {
    title: `${EMOJIS.check} Événement configuré`,
    description: `${adminTaunt}\n\n${statusText}`,
    fields: [
      { name: '📅 Début', value: formatDate(startDate), inline: false },
      { name: '📅 Fin', value: formatDate(endDate), inline: false },
      { name: '⏱️ Durée', value: durationText, inline: true },
      { name: '🌍 Timezone', value: timezone, inline: true },
    ],
    color: isActive ? COLORS.success : COLORS.info,
    timestamp: new Date(),
  }
}

/**
 * Format : /setup status - Affichage du statut de configuration
 */
export function formatSetupStatus(payload: {
  hasChannels: boolean
  hasEvent: boolean
  generalChannelId?: string
  trackerChannelId?: string
  startDate?: Date
  endDate?: Date
  timezone?: string
  isActive?: boolean
}): DiscordEmbed {
  const { hasChannels, hasEvent, generalChannelId, trackerChannelId, startDate, endDate, timezone, isActive } = payload

  const channelsStatus = hasChannels ? `${EMOJIS.check} Configurés` : `${EMOJIS.warning} Non configurés`
  const eventStatus = hasEvent ? `${EMOJIS.check} Configuré` : `${EMOJIS.warning} Non configuré`

  const fields = []

  // Channels
  if (hasChannels && generalChannelId && trackerChannelId) {
    fields.push({
      name: '💬 Channels',
      value: `General: <#${generalChannelId}>\nTracker: <#${trackerChannelId}>`,
      inline: false,
    })
  } else {
    fields.push({
      name: '💬 Channels',
      value: `${EMOJIS.warning} Non configurés\nUtilise \`/setup channels\``,
      inline: false,
    })
  }

  // Event
  if (hasEvent && startDate && endDate && timezone) {
    const formatDate = (date: Date) => {
      return date.toLocaleString('fr-FR', {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }

    const statusEmoji = isActive ? '🟢' : '⏳'
    const statusText = isActive ? 'Actif' : 'Pas encore commencé'

    fields.push({
      name: '📅 Événement',
      value: `${statusEmoji} ${statusText}\n**Début** : ${formatDate(startDate)}\n**Fin** : ${formatDate(endDate)}\n**Timezone** : ${timezone}`,
      inline: false,
    })
  } else {
    fields.push({
      name: '📅 Événement',
      value: `${EMOJIS.warning} Non configuré\nUtilise \`/setup event\``,
      inline: false,
    })
  }

  const allConfigured = hasChannels && hasEvent
  const color = allConfigured ? COLORS.success : COLORS.warning

  return {
    title: `${EMOJIS.scroll} Configuration du Bot`,
    description: allConfigured
      ? '✅ Le bot est **entièrement configuré** et prêt à démarrer !'
      : '⚠️ Configuration **incomplète**. Certains éléments doivent être configurés.',
    fields,
    color,
    timestamp: new Date(),
  }
}

/**
 * Format : /setup reset - Réinitialisation des données
 */
export function formatSetupReset(payload: {
  playerCount: number
  duoCount: number
  gameCount: number
}): DiscordEmbed {
  const { playerCount, duoCount, gameCount } = payload
  const resetTaunt = getRandomTaunt('adminReset')

  return {
    title: `${EMOJIS.cross} Données réinitialisées`,
    description: `${resetTaunt}\n\nLe challenge peut maintenant recommencer depuis zéro. Que les meilleurs gagnent ! 🏆`,
    fields: [
      {
        name: '🗑️ Supprimé',
        value: `• ${playerCount} joueur${playerCount > 1 ? 's' : ''}\n• ${duoCount} duo${duoCount > 1 ? 's' : ''}\n• ${gameCount} game${gameCount > 1 ? 's' : ''}`,
        inline: true,
      },
      {
        name: '✅ Conservé',
        value: '• Configuration des channels\n• Dates de l\'événement\n• Clé API Riot',
        inline: true,
      },
    ],
    color: COLORS.warning,
    footer: { text: 'Les joueurs peuvent se réinscrire avec /register' },
    timestamp: new Date(),
  }
}

// ============================================================================
// NOTIFICATION FORMATTERS
// ============================================================================

/**
 * Format : Notification de game détectée (en cours)
 */
export function formatGameDetected(payload: {
  noobName: string
  carryName: string
  duoName: string
}): DiscordEmbed {
  const { noobName, carryName, duoName } = payload

  return {
    title: `${EMOJIS.game} Game en cours !`,
    description: `Le duo **${duoName}** est en game !\n\n${noobName} ${EMOJIS.duo} ${carryName}`,
    color: COLORS.info,
    footer: { text: 'Le résultat sera tracké automatiquement' },
    timestamp: new Date(),
  }
}

/**
 * Format : Notification de daily ladder (classement quotidien)
 */
export function formatDailyLadder(payload: {
  topDuos: Array<{
    rank: number
    duoName: string
    noobName: string
    carryName: string
    totalPoints: number
    wins: number
    losses: number
  }>
  date: Date
}): DiscordEmbed {
  const { topDuos, date } = payload

  const description = topDuos.length > 0
    ? topDuos
        .map((duo) => {
          const { rank, duoName, noobName, carryName, totalPoints, wins, losses } = duo
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**${rank}.**`
          return `${medal} **${duoName}** • **${totalPoints}** pts (${wins}W/${losses}L)\n   └─ ${noobName} ${EMOJIS.duo} ${carryName}`
        })
        .join('\n\n')
    : 'Aucun duo classé pour le moment'

  const dateStr = date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  // Taunt motivationnel pour le top 1
  const taunt = topDuos.length > 0 ? `\n\n${getRandomTaunt('ladderTrash')}` : ''

  return {
    title: `${EMOJIS.trophy} Classement Quotidien`,
    description: `**${dateStr}**\n\n${description}${taunt}`,
    color: COLORS.legendary,
    footer: { text: 'Utilisez /ladder pour voir le classement complet' },
    timestamp: new Date(),
  }
}
