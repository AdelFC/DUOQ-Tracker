import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'

/**
 * Handler pour la désinscription d'un joueur du challenge
 *
 * Comportement :
 * - Supprime le joueur du state
 * - Si le joueur était en duo :
 *   - Dissout le duo
 *   - Libère le partenaire (retire son duoId)
 *   - Notifie le partenaire
 *
 * @param msg - Message de commande
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function unregisterHandler(msg: Message, state: State, responses: Response[]): void {
  const discordId = msg.sourceId

  // Vérifier si le joueur est inscrit
  const player = state.players.get(discordId)
  if (!player) {
    responses.push({
      type: MessageType.ERROR,
      targetId: discordId,
      content: '❌ Tu n\'es pas inscrit au challenge.',
      ephemeral: true,
    })
    return
  }

  const { gameName, duoId } = player

  // Si le joueur est en duo, dissoudre le duo
  if (duoId !== 0) {
    const duo = state.duos.get(duoId)

    if (duo) {
      // Trouver le partenaire
      const partnerId = duo.noobId === discordId ? duo.carryId : duo.noobId
      const partner = state.players.get(partnerId)

      // Libérer le partenaire
      if (partner) {
        partner.duoId = 0

        // Notifier le partenaire
        responses.push({
          type: MessageType.INFO,
          targetId: partnerId,
          content: `💔 **${gameName}** a quitté le challenge. Votre duo a été dissous. Vous pouvez vous lier avec un autre joueur via \`/link\`.`,
          ephemeral: false,
        })
      }

      // NOTE: GameTracker removed - no longer needed with new Riot API

      // Supprimer le duo
      state.duos.delete(duoId)
    }
  }

  // Supprimer le joueur
  state.players.delete(discordId)

  // Confirmer la désinscription
  responses.push({
    type: MessageType.SUCCESS,
    targetId: discordId,
    content: `👋 **${gameName}**, tu as été désinscrit du challenge avec succès. Tes statistiques ont été supprimées.`,
    ephemeral: false,
  })
}
