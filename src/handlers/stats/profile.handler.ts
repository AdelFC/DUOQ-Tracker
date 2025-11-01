import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'

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

  // Récupérer les informations du duo si applicable
  let duoInfo = 'Aucun duo'
  let duoPartnerName = ''
  if (targetPlayer.duoId) {
    const duo = state.duos.get(targetPlayer.duoId)
    if (duo) {
      duoInfo = duo.name
      // Trouver le partenaire
      const partnerId = targetPlayer.role === 'noob' ? duo.carryId : duo.noobId
      const partner = state.players.get(partnerId)
      if (partner) {
        duoPartnerName = partner.gameName
      }
    }
  }

  // Calculer le winrate
  const totalGames = targetPlayer.wins + targetPlayer.losses
  let winrate = 0
  if (totalGames > 0) {
    winrate = Math.round((targetPlayer.wins / totalGames) * 100)
  }

  // Construire l'embed
  const embed = {
    title: `📊 Profil de ${targetPlayer.gameName}#${targetPlayer.tagLine}`,
    description: buildDescription(targetPlayer, duoInfo, duoPartnerName, winrate),
    color: 0x3498db,
    footer: {
      text: 'DuoQ Tracker',
    },
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
  duoInfo: string,
  duoPartnerName: string,
  winrate: number
): string {
  const lines: string[] = []

  // Section: Points & Stats
  lines.push(`**Points:** **${player.totalPoints}** pts`)
  lines.push(`**Bilan:** ${player.wins}W/${player.losses}L (${winrate}%)`)
  lines.push('')

  // Section: Rank
  const initialRankStr = formatRank(player.initialRank)
  const currentRankStr = formatRank(player.currentRank)
  lines.push(`**Progression:**`)
  lines.push(`${initialRankStr} → ${currentRankStr}`)
  lines.push('')

  // Section: Duo
  lines.push(`**Duo:** ${duoInfo}`)
  if (duoPartnerName) {
    lines.push(`└─ Partenaire: ${duoPartnerName}`)
  }
  lines.push('')

  // Section: Winstreak (si > 0)
  if (player.winStreak > 0) {
    lines.push(`🔥 **Winstreak:** ${player.winStreak}`)
  }

  return lines.join('\n')
}

function formatRank(rank: { tier: string; division: string; lp: number }): string {
  return `${rank.tier} ${rank.division} (${rank.lp} LP)`
}
