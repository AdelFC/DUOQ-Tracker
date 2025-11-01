/**
 * Handler pour /key show
 * Affiche la clé API Riot actuelle
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleKeyShow(message: Message, state: State, responses: Response[]): void {
  // Handle both Config object and ConfigService
  const riotApiKey =
    typeof state.config === 'object' && 'getSync' in state.config
      ? state.config.getSync('riotApiKey')
      : (state.config as any).riotApiKey

  if (!riotApiKey) {
    responses.push({
      type: MessageType.INFO,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Clé API Riot',
        description: 'Aucune clé API Riot définie',
        fields: [
          {
            name: 'Status',
            value: 'Non configuré',
            inline: false,
          },
        ],
        color: 0xffa500,
        footer: {
          text: 'Utilisez /key set pour définir une clé API',
        },
      }),
      ephemeral: true,
    })
    return
  }

  // Masquer la clé en n'affichant que les premiers et derniers caractères
  const maskedKey =
    riotApiKey.length > 10
      ? `${riotApiKey.substring(0, 8)}${'*'.repeat(riotApiKey.length - 16)}${riotApiKey.substring(riotApiKey.length - 8)}`
      : `${riotApiKey.substring(0, 2)}${'*'.repeat(riotApiKey.length - 4)}${riotApiKey.substring(riotApiKey.length - 2)}`

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Clé API Riot',
      description: 'Clé API Riot configurée',
      fields: [
        {
          name: 'Clé masquée',
          value: `\`${maskedKey}\``,
          inline: false,
        },
        {
          name: 'Longueur',
          value: `${riotApiKey.length} caractères`,
          inline: true,
        },
        {
          name: 'Status',
          value: 'Configuré',
          inline: true,
        },
      ],
      color: 0x00ff00,
      footer: {
        text: 'Cette clé est utilisée pour toutes les requêtes Riot API',
      },
    }),
    ephemeral: true,
  })
}
