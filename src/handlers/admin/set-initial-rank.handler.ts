/**
 * Handler pour /admin set-initial-rank
 * Commande temporaire pour corriger l'initialRank des joueurs déjà inscrits
 * À SUPPRIMER après correction
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { parseRankString } from '../../services/scoring/rank-utils.js'

interface SetInitialRankPayload {
  userId: string
  rank: string // Format: "G2", "P4", "D1", etc.
}

export async function handleSetInitialRank(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { userId, rank } = message.payload as SetInitialRankPayload
  const adminId = message.sourceId

  // Validation 1: Le joueur existe
  const player = state.players.get(userId)
  if (!player) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: `❌ Ce joueur n'est pas inscrit au challenge.`,
      ephemeral: true,
    })
    return
  }

  // Validation 2: Format du rank
  let parsedRank
  try {
    parsedRank = parseRankString(rank.trim().toUpperCase())
  } catch (error) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: `❌ Format de rang invalide: "${rank}". Formats acceptés: I4, B3, S2, G1, P4, E3, D2, M, GM, C`,
      ephemeral: true,
    })
    return
  }

  // Formater pour affichage
  const formatRank = (r: typeof parsedRank): string => {
    if (r.tier === 'MASTER' || r.tier === 'GRANDMASTER' || r.tier === 'CHALLENGER') {
      return `${r.tier} (${r.lp} LP)`
    }
    return `${r.tier} ${r.division} (${r.lp} LP)`
  }

  const oldInitialRank = formatRank(player.initialRank)
  const newInitialRank = formatRank(parsedRank)

  // Mettre à jour
  player.initialRank = parsedRank

  // Log
  console.log(
    `[Admin] ${adminId} updated initialRank for ${player.gameName}#${player.tagLine}: ${oldInitialRank} → ${newInitialRank}`
  )

  // Réponse
  responses.push({
    type: MessageType.SUCCESS,
    targetId: adminId,
    content: JSON.stringify({
      title: '✅ Initial Rank mis à jour',
      description: [
        `**Joueur:** ${player.gameName}#${player.tagLine}`,
        '',
        `**Ancien initial rank:** ${oldInitialRank}`,
        `**Nouveau initial rank:** ${newInitialRank}`,
        `**Current rank:** ${formatRank(player.currentRank)}`,
        '',
        `La progression affichera maintenant: ${newInitialRank} → ${formatRank(player.currentRank)}`,
      ].join('\n'),
      color: 0x00ff00,
      footer: { text: '⚠️ Commande temporaire - À supprimer après utilisation' },
    }),
    ephemeral: false, // Visible pour transparence
  })
}
