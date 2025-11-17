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

  const description = [
    `${EMOJIS.party} Bienvenue dans le **DuoQ Tracker**, **${gameName}**#**${tagLine}** !`,
    '',
    `${getRandomTaunt('welcome')}`,
    '',
    '─────────────────────',
    '',
    `${roleEmoji} **Rôle:** ${roleText}`,
    `${rankEmoji} **Rank de départ:** ${initialRank}`,
  ].join('\n')

  return {
    title: `${EMOJIS.check} Inscription validée`,
    description,
    color: COLORS.success,
    footer: { text: '💡 Prochaine étape : Utilise /link pour former un duo !' },
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
  breakdown?: any // ScoreBreakdown détaillé
  alerts?: Array<{ type: string; player?: string; message: string }>
  isRemakeOrEarlyGame?: boolean
}): DiscordEmbed {
  const {
    noobName,
    carryName,
    win,
    noobPoints,
    carryPoints,
    noobKDA,
    carryKDA,
    duration,
    totalPoints,
    breakdown,
    alerts,
    isRemakeOrEarlyGame,
  } = payload

  const resultEmoji = win ? EMOJIS.victory : EMOJIS.defeat
  const resultText = win ? '**VICTOIRE**' : '**DÉFAITE**'
  const color = win ? COLORS.victory : COLORS.defeat
  const taunt = win ? getRandomTaunt('victory') : getRandomTaunt('defeat')

  const durationMin = Math.floor(duration / 60)
  const durationSec = duration % 60

  // Points avec formatage coloré
  const noobPointsStr = noobPoints > 0 ? `+${noobPoints}` : `${noobPoints}`
  const carryPointsStr = carryPoints > 0 ? `+${carryPoints}` : `${carryPoints}`

  // Alertes spéciales en haut si présentes
  let alertsText = ''
  if (alerts && alerts.length > 0) {
    alertsText = alerts.map((a) => a.message).join('\n') + '\n\n'
  }

  const description = [
    alertsText,
    `${resultEmoji} ${resultText}`,
    '',
    `**${noobName}** ${EMOJIS.duo} **${carryName}**`,
    '',
    taunt,
    '',
    '─────────────────────',
  ].join('\n')

  // Champs de base
  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: `${EMOJIS.noob} ${noobName}`,
      value: `💎 **${noobPointsStr}** pts\n⚔️ KDA: \`${noobKDA}\``,
      inline: true,
    },
    {
      name: `${EMOJIS.carry} ${carryName}`,
      value: `💎 **${carryPointsStr}** pts\n⚔️ KDA: \`${carryKDA}\``,
      inline: true,
    },
    {
      name: `${EMOJIS.clock} Durée`,
      value: `\`${durationMin}:${durationSec.toString().padStart(2, '0')}\``,
      inline: true,
    },
  ]

  // Détails du calcul (en italique, petit texte)
  if (breakdown && !isRemakeOrEarlyGame) {
    const noob = breakdown.noob
    const carry = breakdown.carry
    const duo = breakdown.duo

    const formatNum = (n: number) => (n > 0 ? `+${n}` : `${n}`)

    // Formatage du peak multiplier avec détails
    const formatPeakMultiplier = (pm: any) => {
      if (pm.multiplier === 1.0) return null

      const mult = `×${pm.multiplier.toFixed(2)}`

      // Si on a le peak rank et le current rank, afficher le détail
      if (pm.peakRank && pm.currentRank) {
        const tierDiffAbs = Math.abs(pm.tierDiff)
        const direction = pm.tierDiff > 0 ? '-' : '+'
        return `*Peak: ${mult} (${pm.peakRank} → ${pm.currentRank}, ${direction}${tierDiffAbs} tier${tierDiffAbs > 1 ? 's' : ''})*`
      }

      // Fallback si pas de détails
      return `*Peak: ${mult}*`
    }

    // NOOB: Affichage transparent étape par étape
    const noobParts: string[] = []

    // Étapes 1-3: KDA + Streak + Bonus spéciaux
    noobParts.push(`*KDA ${formatNum(Math.round(noob.kda.final))}*`)
    if (noob.streak.total !== 0) {
      noobParts.push(`*Streak ${formatNum(noob.streak.total)}${noob.streak.milestone ? ` (${formatNum(noob.streak.progressive)}+${formatNum(noob.streak.milestone)})` : ''}*`)
    }
    if (noob.specialBonuses.total > 0) {
      noobParts.push(`*Bonus ${formatNum(noob.specialBonuses.total)}*`)
    }

    // Étape 4: Subtotal (avant cap)
    const noobSubtotalStr = `*= ${formatNum(noob.subtotal)}*`

    // Étape 5: Cap individuel (si appliqué)
    let noobCapStr = ''
    if (noob.subtotal !== noob.capped) {
      noobCapStr = ` *→ ${formatNum(noob.capped)} (cap)*`
    }

    // Étape 6: Peak multiplier (si appliqué)
    const noobPeakStr = formatPeakMultiplier(noob.peakMultiplier)

    // Étape 7: Final
    const noobFinalStr = `*→ ${formatNum(noob.final)} pts*`

    // Si pas de peak, afficher le final sur la ligne 1
    // Si peak, afficher le final sur la ligne 2
    const noobLine1 = noobParts.join(' | ') + ' ' + noobSubtotalStr + noobCapStr + (noobPeakStr ? '' : ' ' + noobFinalStr)
    const noobLine2 = noobPeakStr ? `${noobPeakStr} ${noobFinalStr}` : null

    // CARRY: Affichage transparent étape par étape
    const carryParts: string[] = []

    // Étapes 1-3: KDA + Streak + Bonus spéciaux
    carryParts.push(`*KDA ${formatNum(Math.round(carry.kda.final))}*`)
    if (carry.streak.total !== 0) {
      carryParts.push(`*Streak ${formatNum(carry.streak.total)}${carry.streak.milestone ? ` (${formatNum(carry.streak.progressive)}+${formatNum(carry.streak.milestone)})` : ''}*`)
    }
    if (carry.specialBonuses.total > 0) {
      carryParts.push(`*Bonus ${formatNum(carry.specialBonuses.total)}*`)
    }

    // Étape 4: Subtotal (avant cap)
    const carrySubtotalStr = `*= ${formatNum(carry.subtotal)}*`

    // Étape 5: Cap individuel (si appliqué)
    let carryCapStr = ''
    if (carry.subtotal !== carry.capped) {
      carryCapStr = ` *→ ${formatNum(carry.capped)} (cap)*`
    }

    // Étape 6: Peak multiplier (si appliqué)
    const carryPeakStr = formatPeakMultiplier(carry.peakMultiplier)

    // Étape 7: Final
    const carryFinalStr = `*→ ${formatNum(carry.final)} pts*`

    // Si pas de peak, afficher le final sur la ligne 1
    // Si peak, afficher le final sur la ligne 2
    const carryLine1 = carryParts.join(' | ') + ' ' + carrySubtotalStr + carryCapStr + (carryPeakStr ? '' : ' ' + carryFinalStr)
    const carryLine2 = carryPeakStr ? `${carryPeakStr} ${carryFinalStr}` : null

    // DUO: Calcul transparent
    const duoParts: string[] = []

    // Étape 9: Somme
    duoParts.push(`*Noob ${formatNum(noob.final)}*`)
    duoParts.push(`*Carry ${formatNum(carry.final)}*`)
    duoParts.push(`*= ${formatNum(duo.sum)}*`)

    // Étape 10: Résultat de game (comptabilisé ICI, pas au niveau individuel)
    const gameResult = breakdown.noob.gameResult.final // Même valeur pour noob et carry
    if (gameResult !== 0) {
      duoParts.push(`*Résultat ${formatNum(gameResult)}*`)
    }

    // Étape 11: Risque
    if (duo.riskBonus.final > 0) {
      duoParts.push(`*Risque ${formatNum(duo.riskBonus.final)}*`)
    }

    // Étape 12: No Death
    if (duo.noDeathBonus > 0) {
      duoParts.push(`*No Death ${formatNum(duo.noDeathBonus)}*`)
    }

    // Étape 13: Subtotal duo
    const duoSubtotalStr = `*= ${formatNum(duo.subtotal)}*`

    // Étape 14: Cap duo (si appliqué)
    let duoCapStr = ''
    if (duo.subtotal !== duo.capped) {
      duoCapStr = ` *→ ${formatNum(duo.capped)} (cap)*`
    }

    // Étape 15: Final
    const duoFinalStr = `*→ ${formatNum(duo.final)} pts*`

    const duoLine = duoParts.join(' | ') + ' ' + duoSubtotalStr + duoCapStr + ' ' + duoFinalStr

    // Construire les fields
    const detailFields: Array<{ name: string; value: string; inline?: boolean }> = []

    // Noob
    let noobValue = noobLine1
    if (noobLine2) noobValue += `\n${noobLine2}`
    detailFields.push({
      name: '📊 Détail Noob',
      value: noobValue,
      inline: false,
    })

    // Carry
    let carryValue = carryLine1
    if (carryLine2) carryValue += `\n${carryLine2}`
    detailFields.push({
      name: '📊 Détail Carry',
      value: carryValue,
      inline: false,
    })

    // Duo
    detailFields.push({
      name: '📊 Détail Duo',
      value: duoLine,
      inline: false,
    })

    fields.push(...detailFields)
  }

  let footerText = 'GG WP !'
  if (isRemakeOrEarlyGame) {
    footerText = '⚠️ Remake ou partie < 5 min : 0 points attribués'
  } else if (totalPoints !== undefined) {
    footerText = `💰 Total du duo : ${totalPoints > 0 ? '+' : ''}${totalPoints} pts | GG WP !`
  }

  return {
    description,
    fields,
    color: isRemakeOrEarlyGame ? COLORS.warning : color,
    footer: { text: footerText },
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
          const totalGames = wins + losses
          const winrate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0

          // Médailles pour le podium
          const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `**#${rank}**`

          // Barre de progression visuelle du winrate
          const progressBar = createProgressBar(wins, totalGames, 8)

          return [
            `${medal} **${duoName}**`,
            `   💎 **${totalPoints}** pts`,
            `   📊 ${wins}W - ${losses}L (\`${winrate}%\`)`,
            `   ${progressBar}`,
            `   👥 ${noobName} ${EMOJIS.duo} ${carryName}`,
          ].join('\n')
        })
        .join('\n\n')
    : '⚠️ Aucun duo n\'a encore joué de games\n\nUtilisez `/link` pour former un duo !'

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
  devChannelId?: string
}): DiscordEmbed {
  const { generalChannelId, trackerChannelId, devChannelId } = payload
  const adminTaunt = getRandomTaunt('admin')

  const fields = [
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
  ]

  if (devChannelId) {
    fields.push({
      name: '🔧 Channel Dev',
      value: `<#${devChannelId}>\nLogs de scoring détaillés`,
      inline: true,
    })
  }

  const footerText = devChannelId
    ? 'Messages de test envoyés dans les trois channels'
    : 'Messages de test envoyés dans les deux channels'

  return {
    title: `${EMOJIS.check} Channels configurés`,
    description: `${adminTaunt}\n\nLes channels Discord ont été configurés avec succès.`,
    fields,
    color: COLORS.success,
    footer: { text: footerText },
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
  devChannelId?: string
  startDate?: Date
  endDate?: Date
  timezone?: string
  isActive?: boolean
  playerCount?: number
  duoCount?: number
  gameCount?: number
  hasApiKey?: boolean
}): DiscordEmbed {
  const {
    hasChannels,
    hasEvent,
    generalChannelId,
    trackerChannelId,
    devChannelId,
    startDate,
    endDate,
    timezone,
    isActive,
    playerCount = 0,
    duoCount = 0,
    gameCount = 0,
    hasApiKey = false,
  } = payload

  const channelsStatus = hasChannels ? `${EMOJIS.check} Configurés` : `${EMOJIS.warning} Non configurés`
  const eventStatus = hasEvent ? `${EMOJIS.check} Configuré` : `${EMOJIS.warning} Non configuré`

  const fields = []

  // Channels
  if (hasChannels && generalChannelId && trackerChannelId && devChannelId) {
    fields.push({
      name: '💬 Channels',
      value: `General: <#${generalChannelId}>\nTracker: <#${trackerChannelId}>\nDev: <#${devChannelId}>`,
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

  // Stats
  const playerPlural = playerCount === 1 ? 'joueur' : 'joueurs'
  const duoPlural = duoCount === 1 ? 'duo' : 'duos'
  const gamePlural = gameCount === 1 ? 'match' : 'matchs'
  fields.push({
    name: '📊 Statistiques',
    value: `${playerCount} ${playerPlural}\n${duoCount} ${duoPlural}\n${gameCount} ${gamePlural}`,
    inline: false,
  })

  // API Key
  fields.push({
    name: '🔑 Clé API Riot',
    value: hasApiKey ? `${EMOJIS.check} Configurée` : `${EMOJIS.warning} Non configurée\nUtilise \`/key set\``,
    inline: false,
  })

  const allConfigured = hasChannels && hasEvent && hasApiKey
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
 * NOTE: formatGameDetected() removed
 *
 * Riot API no longer supports real-time game detection (games in progress).
 * We can only detect completed games via manual polling.
 *
 * Use formatGameFound() instead for completed game notifications.
 */

/**
 * Format : Notification de game terminée trouvée (polling manuel)
 */
export function formatGameFound(payload: {
  noobName: string
  carryName: string
  duoName: string
  win: boolean
}): DiscordEmbed {
  const { noobName, carryName, duoName, win } = payload
  const result = win ? `${EMOJIS.win} Victoire` : `${EMOJIS.loss} Défaite`

  return {
    title: `${EMOJIS.game} Game terminée détectée !`,
    description: `Le duo **${duoName}** a terminé une game !\n\n${noobName} ${EMOJIS.duo} ${carryName}\n\n${result}`,
    color: win ? COLORS.success : COLORS.error,
    footer: { text: 'Scoring en attente' },
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
