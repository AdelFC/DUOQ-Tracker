/**
 * Game Embed Formatters
 *
 * Provides embed formatters for game notifications and results
 */

import { type EmbedField, type EmbedData, Colors, customEmbed } from './base-embeds'

/**
 * Game Detected Notification
 *
 * @param duoName - Name of the duo
 * @param noobName - Noob player name
 * @param carryName - Carry player name
 * @param matchId - Match ID
 * @returns Formatted embed
 */
export function gameDetectedEmbed(
  duoName: string,
  noobName: string,
  carryName: string,
  matchId: string
): string {
  const embed: EmbedData = {
    title: '🎮 Game détectée !',
    description: `Le duo **${duoName}** est en train de jouer une ranked game.`,
    color: Colors.INFO,
    fields: [
      {
        name: '👥 Duo',
        value: `${noobName} 🤝 ${carryName}`,
        inline: false,
      },
      {
        name: '🔍 Match ID',
        value: `\`${matchId}\``,
        inline: false,
      },
    ],
    footer: {
      text: 'Bonne chance ! 🍀',
    },
  }

  return customEmbed(embed)
}

/**
 * Game Ended Notification
 *
 * @param duoName - Name of the duo
 * @param noobName - Noob player name
 * @param carryName - Carry player name
 * @param win - Whether the game was won
 * @param noobKDA - Noob KDA (kills/deaths/assists)
 * @param carryKDA - Carry KDA (kills/deaths/assists)
 * @param pointsAwarded - Points awarded
 * @param duration - Game duration in seconds
 * @param matchId - Match ID
 * @returns Formatted embed
 */
export function gameEndedEmbed(
  duoName: string,
  noobName: string,
  carryName: string,
  win: boolean,
  noobKDA: { kills: number; deaths: number; assists: number },
  carryKDA: { kills: number; deaths: number; assists: number },
  pointsAwarded: number,
  duration: number,
  matchId: string
): string {
  const resultEmoji = win ? '🏆' : '💀'
  const resultText = win ? 'VICTOIRE' : 'DÉFAITE'
  const color = win ? Colors.GAME_WIN : Colors.GAME_LOSS

  // Format duration
  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const durationText = `${minutes}m ${seconds}s`

  // Calculate KDA ratios
  const noobKDAValue = noobKDA.deaths === 0
    ? 'Perfect'
    : ((noobKDA.kills + noobKDA.assists) / noobKDA.deaths).toFixed(2)
  const carryKDAValue = carryKDA.deaths === 0
    ? 'Perfect'
    : ((carryKDA.kills + carryKDA.assists) / carryKDA.deaths).toFixed(2)

  const fields: EmbedField[] = [
    {
      name: '👥 Duo',
      value: duoName,
      inline: false,
    },
    {
      name: `📊 ${noobName} (Noob)`,
      value: `**${noobKDA.kills}** / ${noobKDA.deaths} / ${noobKDA.assists}\nKDA: **${noobKDAValue}**`,
      inline: true,
    },
    {
      name: `📊 ${carryName} (Carry)`,
      value: `**${carryKDA.kills}** / ${carryKDA.deaths} / ${carryKDA.assists}\nKDA: **${carryKDAValue}**`,
      inline: true,
    },
    {
      name: '⏱️ Durée',
      value: durationText,
      inline: true,
    },
    {
      name: '🎯 Points',
      value: `${pointsAwarded > 0 ? '+' : ''}**${pointsAwarded}** pts`,
      inline: false,
    },
  ]

  const embed: EmbedData = {
    title: `${resultEmoji} ${resultText}`,
    description: `Le duo **${duoName}** a terminé sa game.`,
    color,
    fields,
    footer: {
      text: `Match: ${matchId}`,
    },
  }

  return customEmbed(embed)
}

/**
 * Points Breakdown Embed
 *
 * Shows detailed scoring breakdown for a game
 *
 * @param basePoints - Base points (win/loss)
 * @param kdaBonus - KDA bonus points
 * @param rankChangeBonus - Rank change bonus
 * @param streakBonus - Win streak bonus
 * @param riskMultiplier - Risk multiplier (rank gap)
 * @param totalPoints - Total points awarded
 * @returns Formatted embed
 */
export function pointsBreakdownEmbed(
  basePoints: number,
  kdaBonus: number,
  rankChangeBonus: number,
  streakBonus: number,
  riskMultiplier: number,
  totalPoints: number
): string {
  const fields: EmbedField[] = [
    {
      name: '⚡ Points de base',
      value: `${basePoints > 0 ? '+' : ''}${basePoints} pts`,
      inline: true,
    },
    {
      name: '💪 Bonus KDA',
      value: `+${kdaBonus} pts`,
      inline: true,
    },
    {
      name: '📈 Bonus Rank',
      value: `+${rankChangeBonus} pts`,
      inline: true,
    },
    {
      name: '🔥 Bonus Streak',
      value: `+${streakBonus} pts`,
      inline: true,
    },
    {
      name: '🎲 Multiplicateur Risk',
      value: `x${riskMultiplier.toFixed(2)}`,
      inline: true,
    },
    {
      name: '🎯 TOTAL',
      value: `**${totalPoints > 0 ? '+' : ''}${totalPoints} pts**`,
      inline: true,
    },
  ]

  const embed: EmbedData = {
    title: '📊 Détail des Points',
    description: 'Calcul du score pour cette game',
    color: Colors.INFO,
    fields,
  }

  return customEmbed(embed)
}

/**
 * Rank Change Notification
 *
 * @param playerName - Player name
 * @param oldRank - Old rank (e.g., "GOLD III")
 * @param newRank - New rank (e.g., "GOLD II")
 * @param isPromotion - Whether it's a promotion (true) or demotion (false)
 * @returns Formatted embed
 */
export function rankChangeEmbed(
  playerName: string,
  oldRank: string,
  newRank: string,
  isPromotion: boolean
): string {
  const emoji = isPromotion ? '📈' : '📉'
  const title = isPromotion ? 'PROMOTION !' : 'Demotion'
  const color = isPromotion ? Colors.SUCCESS : Colors.ERROR

  const embed: EmbedData = {
    title: `${emoji} ${title}`,
    description: `**${playerName}** a changé de rank !`,
    color,
    fields: [
      {
        name: 'Ancien rank',
        value: oldRank,
        inline: true,
      },
      {
        name: isPromotion ? '→' : '↓',
        value: '\u200B', // Zero-width space
        inline: true,
      },
      {
        name: 'Nouveau rank',
        value: `**${newRank}**`,
        inline: true,
      },
    ],
  }

  return customEmbed(embed)
}

/**
 * Ladder Embed
 *
 * @param duos - Array of duos with their stats
 * @param page - Current page number
 * @param totalPages - Total number of pages
 * @param totalDuos - Total number of duos
 * @returns Formatted embed
 */
export function ladderEmbed(
  duos: Array<{
    rank: number
    duoName: string
    noobName: string
    carryName: string
    totalPoints: number
    wins: number
    losses: number
  }>,
  page: number,
  totalPages: number,
  totalDuos: number
): string {
  let description = ''

  if (duos.length === 0) {
    description = 'Aucun duo inscrit pour le moment.\n\nUtilise `/register` puis `/link` pour former un duo !'
  } else {
    duos.forEach((duo) => {
      const medal = duo.rank === 1 ? '🥇' : duo.rank === 2 ? '🥈' : duo.rank === 3 ? '🥉' : `${duo.rank}.`
      const winrate = duo.wins + duo.losses > 0
        ? Math.round((duo.wins / (duo.wins + duo.losses)) * 100)
        : 0

      description += `${medal} **${duo.duoName}**\n`
      description += `   ${duo.noobName} 🤝 ${duo.carryName}\n`
      description += `   🎯 **${duo.totalPoints}** pts • ${duo.wins}W/${duo.losses}L (${winrate}%)\n\n`
    })
  }

  const embed: EmbedData = {
    title: '🏆 Classement DUOQ',
    description,
    color: Colors.INFO,
    footer: {
      text: `Page ${page}/${totalPages} • ${totalDuos} duo${totalDuos > 1 ? 's' : ''}`,
    },
  }

  return customEmbed(embed)
}

/**
 * Daily Ladder Embed
 *
 * Special version of ladder for daily automated posts
 *
 * @param duos - Top 5 duos
 * @param totalDuos - Total number of duos
 * @param date - Date of the ladder
 * @returns Formatted embed
 */
export function dailyLadderEmbed(
  duos: Array<{
    rank: number
    duoName: string
    noobName: string
    carryName: string
    totalPoints: number
    wins: number
    losses: number
  }>,
  totalDuos: number,
  date: Date
): string {
  const dateFormatted = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let description = `📅 **${dateFormatted}**\n\n`

  if (duos.length === 0) {
    description += 'Aucun duo inscrit pour le moment.'
  } else {
    description += '**Top 5 du jour :**\n\n'
    duos.slice(0, 5).forEach((duo) => {
      const medal = duo.rank === 1 ? '🥇' : duo.rank === 2 ? '🥈' : duo.rank === 3 ? '🥉' : `${duo.rank}.`
      const winrate = duo.wins + duo.losses > 0
        ? Math.round((duo.wins / (duo.wins + duo.losses)) * 100)
        : 0

      description += `${medal} **${duo.duoName}** • **${duo.totalPoints}** pts\n`
      description += `   ${duo.noobName} 🤝 ${duo.carryName} • ${duo.wins}W/${duo.losses}L (${winrate}%)\n\n`
    })
  }

  const embed: EmbedData = {
    title: '🏆 Classement Quotidien DUOQ',
    description,
    color: 0xffd700, // Gold
    footer: {
      text: `${totalDuos} duo${totalDuos > 1 ? 's' : ''} inscrit${totalDuos > 1 ? 's' : ''} • Challenge DUOQ`,
    },
    timestamp: date,
  }

  return customEmbed(embed)
}
