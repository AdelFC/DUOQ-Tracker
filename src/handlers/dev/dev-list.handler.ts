/**
 * Handler pour /dev list
 * Liste tous les développeurs notifiés
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleDevList(message: Message, state: State, responses: Response[]): void {
  const devs = state.devs

  if (devs.size === 0) {
    responses.push({
      type: MessageType.INFO,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Liste des développeurs',
        description: 'Aucun développeur enregistré pour les notifications',
        color: 0x5865f2,
      }),
      ephemeral: false,
    })
    return
  }

  // Créer la liste des devs
  const devList = Array.from(devs.values())
    .map((dev, index) => `${index + 1}. <@${dev.userId}>`)
    .join('\n')

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Liste des développeurs notifiés',
      description: `${devs.size} développeur(s) enregistré(s) pour les notifications de reset de clé API`,
      fields: [
        {
          name: 'Développeurs',
          value: devList,
          inline: false,
        },
      ],
      color: 0x5865f2,
      footer: {
        text: 'Ces utilisateurs seront mentionnés lors des resets de clé API Riot',
      },
    }),
    ephemeral: false,
  })
}
