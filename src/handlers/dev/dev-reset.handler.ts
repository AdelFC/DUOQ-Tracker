/**
 * Handler pour /dev reset
 * Réinitialise toutes les données du bot
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleDevReset(message: Message, state: State, responses: Response[]): void {
  const playerCount = state.players.size
  const duoCount = state.duos.size
  const gameCount = state.games.size

  // Réinitialiser toutes les données
  state.players.clear()
  state.duos.clear()
  state.games.clear()

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Bot réinitialisé',
      description: 'Toutes les données ont été supprimées',
      fields: [
        {
          name: 'Joueurs supprimés',
          value: `${playerCount} joueur(s)`,
          inline: true,
        },
        {
          name: 'Duos supprimés',
          value: `${duoCount} duo(s)`,
          inline: true,
        },
        {
          name: 'Games supprimées',
          value: `${gameCount} game(s)`,
          inline: true,
        },
      ],
      color: 0xff0000,
      footer: {
        text: 'Le bot a été réinitialisé aux valeurs par défaut',
      },
    }),
    ephemeral: false,
  })
}
