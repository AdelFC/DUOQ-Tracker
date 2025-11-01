/**
 * Handler pour /dev add
 * Ajoute un développeur à la liste de notification pour les resets de clé API
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleDevAdd(message: Message, state: State, responses: Response[]): void {
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

  // Ajouter le dev à la map
  const devs = state.devs

  if (devs.has(userId)) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Développeur déjà enregistré',
        description: `<@${userId}> est déjà dans la liste des développeurs notifiés`,
        color: 0xffa500,
      }),
      ephemeral: true,
    })
    return
  }

  // Ajouter le dev
  devs.set(userId, {
    discordId: userId,
    addedAt: new Date(),
    addedBy: message.sourceId,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Développeur ajouté',
      description: `<@${userId}> a été ajouté à la liste des développeurs notifiés`,
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
