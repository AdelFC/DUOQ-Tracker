/**
 * Handler pour /profile [@joueur]
 * Afficher les statistiques complètes d'un joueur (personnel + duo)
 * Inspiré du /stats du Pacte pour plus de détails et meilleure UX
 */

import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'
import { getRankEmoji, getMotivationalFooter } from '../../constants/lore.js'

export function profileHandler(msg: Message, state: State, responses: Response[]): void {
  const sourceId = msg.sourceId
  const payload = msg.payload as { targetId?: string } | undefined

  // Extraire l'utilisateur cible (targetId fourni ou soi-même)
  const targetUserId = payload?.targetId || sourceId

  // Vérifier que le joueur cible existe
  const targetPlayer = state.players.get(targetUserId)
  if (!targetPlayer) {
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content: `❌ Ce joueur n'est pas inscrit au challenge DuoQ.`,
      ephemeral: true,
    })
    return
  }

  // Calculer winrate personnel
  const totalGames = targetPlayer.wins + targetPlayer.losses
  const winrate = totalGames > 0 ? Math.round((targetPlayer.wins / totalGames) * 100) : 0

  // Récupérer les informations du duo
  let duo: any = null
  let partner: any = null
  let duoStats: any = null

  if (targetPlayer.duoId) {
    duo = state.duos.get(targetPlayer.duoId)
    if (duo) {
      const partnerId = targetPlayer.role === 'noob' ? duo.carryId : duo.noobId
      partner = state.players.get(partnerId)

      // Stats du duo
      const duoTotalGames = duo.wins + duo.losses
      const duoWinrate = duoTotalGames > 0 ? Math.round((duo.wins / duoTotalGames) * 100) : 0

      duoStats = {
        name: duo.name,
        wins: duo.wins,
        losses: duo.losses,
        totalGames: duoTotalGames,
        winrate: duoWinrate,
        totalPoints: duo.totalPoints,
        currentStreak: duo.currentStreak,
        longestWinStreak: duo.longestWinStreak,
      }
    }
  }

  // Couleur de l'embed selon winrate
  const embedColor = getEmbedColor(winrate)

  // Construire l'embed avec userId pour que le bot puisse récupérer l'avatar
  const embed = {
    title: `📊 Profil de ${targetPlayer.gameName}#${targetPlayer.tagLine}`,
    description: buildDescription(targetPlayer, partner, duoStats, winrate),
    color: embedColor,
    thumbnail: {
      url: `discord://avatar/${targetUserId}`, // Le bot va remplacer par l'avatar Discord
    },
    footer: {
      text: getMotivationalFooter(winrate),
    },
    timestamp: new Date().toISOString(),
  }

  responses.push({
    type: MessageType.SUCCESS,
    targetId: sourceId,
    content: JSON.stringify(embed),
    ephemeral: false,
  })
}

function buildDescription(
  player: any,
  partner: any,
  duoStats: any,
  winrate: number
): string {
  const lines: string[] = []

  // ===== SECTION 1: STATS PERSONNELLES =====
  lines.push(`### 🎮 Stats Personnelles`)
  lines.push('')

  // Points et bilan
  lines.push(`**💎 Points:** ${player.totalPoints} pts`)
  lines.push(`**📊 Bilan:** ${player.wins}W / ${player.losses}L (**${winrate}%**)`)

  // Streaks
  if (player.streaks.current > 0) {
    lines.push(`**🔥 Série actuelle:** ${player.streaks.current} victoires`)
  }
  if (player.streaks.longestWin > 0) {
    lines.push(`**👑 Record personnel:** ${player.streaks.longestWin} victoires`)
  }

  lines.push('')

  // Progression rank
  const initialRankStr = formatRank(player.initialRank)
  const currentRankStr = formatRank(player.currentRank)
  const rankEmoji = getRankEmoji(player.currentRank.tier)

  lines.push(`**📈 Progression:**`)
  lines.push(`${initialRankStr} → ${currentRankStr} ${rankEmoji}`)
  lines.push('')

  // Informations champion/role
  if (player.mainRoleString) {
    lines.push(`**⚔️ Rôle principal:** ${capitalizeRole(player.mainRoleString)}`)
  }
  if (player.mainChampion) {
    lines.push(`**🎯 Champion principal:** ${player.mainChampion}`)
  }
  if (player.peakElo) {
    lines.push(`**🏆 Meilleur ELO:** ${player.peakElo}`)
  }

  lines.push('')

  // ===== SECTION 2: STATS DUO =====
  if (duoStats && partner) {
    lines.push(`### 👥 Stats Duo`)
    lines.push('')
    lines.push(`**🔗 Duo:** ${duoStats.name}`)
    lines.push(`**👤 Partenaire:** ${partner.gameName}#${partner.tagLine}`)
    lines.push(`**💎 Points duo:** ${duoStats.totalPoints} pts`)
    lines.push(`**📊 Bilan duo:** ${duoStats.wins}W / ${duoStats.losses}L (**${duoStats.winrate}%**)`)

    if (duoStats.currentStreak > 0) {
      lines.push(`**🔥 Série en cours:** ${duoStats.currentStreak} victoires`)
    }
    if (duoStats.longestWinStreak > 0) {
      lines.push(`**👑 Record duo:** ${duoStats.longestWinStreak} victoires`)
    }
  } else {
    lines.push(`### 👥 Duo`)
    lines.push('')
    lines.push(`**Aucun duo formé** - Utilisez \`/link\` pour former un duo !`)
  }

  return lines.join('\n')
}

function formatRank(rank: { tier: string; division: string; lp: number }): string {
  // Master+ n'ont pas de divisions
  if (rank.tier === 'MASTER' || rank.tier === 'GRANDMASTER' || rank.tier === 'CHALLENGER') {
    return `${rank.tier} (${rank.lp} LP)`
  }
  return `${rank.tier} ${rank.division} (${rank.lp} LP)`
}

function capitalizeRole(role: string): string {
  const roleMap: Record<string, string> = {
    'top': 'Top',
    'jungle': 'Jungle',
    'mid': 'Mid',
    'adc': 'ADC',
    'support': 'Support',
  }
  return roleMap[role.toLowerCase()] || role
}

function getEmbedColor(winrate: number): number {
  // Couleur selon winrate (vert → bleu → orange → rouge)
  if (winrate >= 70) return 0x2ecc71 // Vert (légende)
  if (winrate >= 55) return 0x3498db // Bleu (champion)
  if (winrate >= 45) return 0x95a5a6 // Gris (équilibré)
  if (winrate >= 30) return 0xf39c12 // Orange (en progression)
  return 0xe74c3c // Rouge (persévérance)
}
