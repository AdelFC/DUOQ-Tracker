/**
 * Handler pour /dev remove
 * Retire un développeur de la liste de notification
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleDevRemove(message: Message, state: State, responses: Response[]): void {
  const { userId } = message.payload

  if (!userId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur',
        description: 'Utilisateur manquant',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Retirer le dev de la map
  const devs = state.devs

  if (!devs.has(userId)) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Développeur non trouvé',
        description: `<@${userId}> n'est pas dans la liste des développeurs notifiés`,
        color: 0xffa500,
      }),
      ephemeral: true,
    })
    return
  }

  // Retirer le dev
  devs.delete(userId)

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Développeur retiré',
      description: `<@${userId}> a été retiré de la liste des développeurs notifiés`,
      fields: [
        {
          name: 'Total',
          value: `${devs.size} développeur(s) enregistré(s)`,
          inline: false,
        },
      ],
      color: 0x00ff00,
    }),
    ephemeral: false,
  })
}
