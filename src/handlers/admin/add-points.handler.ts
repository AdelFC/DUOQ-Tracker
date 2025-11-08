/**
 * Handler pour /add-points
 * Ajoute ou retire manuellement des points à un duo (admin only)
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatError } from '../../formatters/embeds.js'

interface AddPointsPayload {
  teamName: string
  points: number
  adminId: string // Pour l'audit trail
}

/**
 * Format: Points ajoutés/retirés
 */
function formatAddPoints(payload: {
  teamName: string
  points: number
  previousPoints: number
  newPoints: number
  noobName: string
  carryName: string
}): any {
  const { teamName, points, previousPoints, newPoints, noobName, carryName } = payload

  const action = points > 0 ? 'ajoutés' : 'retirés'
  const emoji = points > 0 ? '✅' : '⚠️'
  const color = points > 0 ? 0x57f287 : 0xed4245
  const sign = points > 0 ? '+' : ''

  return {
    title: `${emoji} Points ${action}`,
    description: [
      `**Équipe:** ${teamName}`,
      `**Joueurs:** ${noobName} & ${carryName}`,
      '',
      `**Modification:** ${sign}${points} points`,
      `**Avant:** ${previousPoints} points`,
      `**Après:** ${newPoints} points`,
    ].join('\n'),
    color,
    footer: { text: '🔒 Modification manuelle par un admin' },
    timestamp: new Date(),
  }
}

export async function handleAddPoints(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { teamName, points } = message.payload as AddPointsPayload
  const adminId = message.sourceId

  // Validation: Points ne doivent pas être 0
  if (points === 0) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: JSON.stringify(
        formatError({ error: 'Le nombre de points ne peut pas être 0.' })
      ),
      ephemeral: true,
    })
    return
  }

  // Validation: Points raisonnables (entre -1000 et +1000)
  if (Math.abs(points) > 1000) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: JSON.stringify(
        formatError({
          error: 'Le nombre de points doit être entre -1000 et +1000 pour éviter les erreurs de saisie.',
        })
      ),
      ephemeral: true,
    })
    return
  }

  // Rechercher le duo par nom (insensible à la casse)
  const targetDuo = Array.from(state.duos.values()).find(
    (duo) => duo.name.toLowerCase() === teamName.toLowerCase()
  )

  if (!targetDuo) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: JSON.stringify(
        formatError({
          error: `Aucun duo trouvé avec le nom "${teamName}". Vérifie l'orthographe exacte.`,
        })
      ),
      ephemeral: true,
    })
    return
  }

  // Récupérer les joueurs
  const noob = state.players.get(targetDuo.noobId)
  const carry = state.players.get(targetDuo.carryId)

  if (!noob || !carry) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: JSON.stringify(
        formatError({ error: 'Erreur: joueurs du duo introuvables dans le state.' })
      ),
      ephemeral: true,
    })
    return
  }

  // Sauvegarder l'état précédent pour l'audit
  const previousPoints = targetDuo.totalPoints

  // Validation: éviter les points négatifs
  const newPoints = previousPoints + points
  if (newPoints < 0) {
    responses.push({
      type: MessageType.ERROR,
      targetId: adminId,
      content: JSON.stringify(
        formatError({
          error: `Impossible de retirer ${Math.abs(points)} points. Le duo a seulement ${previousPoints} points. Le total ne peut pas être négatif.`,
        })
      ),
      ephemeral: true,
    })
    return
  }

  // Mettre à jour les points du duo
  targetDuo.totalPoints = newPoints

  // Mettre à jour les points des joueurs individuels
  noob.totalPoints += points
  carry.totalPoints += points

  // Validation: s'assurer que les joueurs n'ont pas de points négatifs
  if (noob.totalPoints < 0) noob.totalPoints = 0
  if (carry.totalPoints < 0) carry.totalPoints = 0

  // Log pour audit trail (console + optionnellement dans un channel dev)
  console.log(
    `[Admin] /add-points - Admin ${adminId} a modifié les points du duo "${targetDuo.name}" (ID: ${targetDuo.id}): ${points > 0 ? '+' : ''}${points} points (${previousPoints} → ${newPoints})`
  )

  // Réponse de confirmation
  const embed = formatAddPoints({
    teamName: targetDuo.name,
    points,
    previousPoints,
    newPoints,
    noobName: `${noob.gameName}#${noob.tagLine}`,
    carryName: `${carry.gameName}#${carry.tagLine}`,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: adminId,
    content: JSON.stringify(embed),
    ephemeral: false, // Visible par tous pour la transparence
  })

  // Optionnel: Log dans le dev channel si configuré
  const devChannelId = state.config && 'getSync' in state.config ? state.config.getSync('devChannelId') : null
  if (devChannelId) {
    responses.push({
      type: MessageType.INFO,
      targetId: devChannelId,
      content: `🔧 **[ADMIN LOG]** <@${adminId}> a modifié les points du duo **${targetDuo.name}**: ${points > 0 ? '+' : ''}${points} points (${previousPoints} → ${newPoints})`,
      ephemeral: false,
    })
  }
}
