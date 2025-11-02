/**
 * Handler pour /key set
 * Définit la clé API Riot
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleKeySet(message: Message, state: State, responses: Response[]): void {
  const { key } = message.payload

  if (!key || typeof key !== 'string') {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur',
        description: 'Clé API manquante',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  const trimmedKey = key.trim()

  if (trimmedKey === '') {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Erreur',
        description: 'La clé API ne peut pas être vide',
        color: 0xff0000,
      }),
      ephemeral: true,
    })
    return
  }

  // Définir la clé API dans la config
  if (typeof state.config === 'object' && 'setSync' in state.config) {
    state.config.setSync('riotApiKey', trimmedKey)
  } else {
    ;(state.config as any).riotApiKey = trimmedKey
  }

  // Notifier tous les devs que la clé a été mise à jour
  const devMentions = Array.from(state.devs.values())
    .map((dev) => `<@${dev.userId}>`)
    .join(' ')

  const devNotification = devMentions
    ? `Développeurs notifiés : ${devMentions}`
    : 'Aucun développeur à notifier'

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Clé API mise à jour',
      description: `La clé API Riot a été définie avec succès`,
      fields: [
        {
          name: 'Clé',
          value: `\`${trimmedKey.substring(0, 20)}...\``,
          inline: false,
        },
        {
          name: 'Notifications',
          value: devNotification,
          inline: false,
        },
      ],
      color: 0x00ff00,
      footer: {
        text: 'La clé sera utilisée pour toutes les requêtes Riot API',
      },
    }),
    ephemeral: true,
  })

  // Si des devs sont enregistrés, envoyer une notification dans le channel général
  if (devMentions) {
    const generalChannelId =
      typeof state.config === 'object' && 'getSync' in state.config
        ? state.config.getSync('generalChannelId')
        : (state.config as any).generalChannelId
    if (generalChannelId) {
      responses.push({
        type: MessageType.INFO,
        targetId: generalChannelId,
        content: JSON.stringify({
          title: 'Clé API Riot mise à jour',
          description: `${devMentions}\n\nLa clé API Riot a été mise à jour par <@${message.sourceId}>`,
          color: 0x5865f2,
          footer: {
            text: 'Toutes les requêtes utiliseront la nouvelle clé',
          },
        }),
        ephemeral: false,
      })
    }
  }
}
