/**
 * Handler pour /dev status
 * Affiche le statut du bot
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleDevStatus(message: Message, state: State, responses: Response[]): void {
  const playerCount = state.players.size
  const duoCount = state.duos.size
  const gameCount = state.games.size
  const devCount = state.devs.size

  const hasApiKey =
    typeof state.config === 'object' && 'getSync' in state.config
      ? !!state.config.getSync('riotApiKey')
      : !!(state.config as any).riotApiKey

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Statut du bot DuoQ Tracker',
      description: 'État actuel du système',
      fields: [
        {
          name: 'Joueurs inscrits',
          value: `${playerCount} joueur(s)`,
          inline: true,
        },
        {
          name: 'Duos actifs',
          value: `${duoCount} duo(s)`,
          inline: true,
        },
        {
          name: 'Games trackées',
          value: `${gameCount} game(s)`,
          inline: true,
        },
        {
          name: 'Développeurs notifiés',
          value: `${devCount} dev(s)`,
          inline: true,
        },
        {
          name: 'Clé API Riot',
          value: hasApiKey ? 'Configurée' : 'Non configurée',
          inline: true,
        },
        {
          name: 'Statut',
          value: 'Online',
          inline: true,
        },
      ],
      color: 0x5865f2,
      footer: {
        text: 'Bot opérationnel',
      },
    }),
    ephemeral: true,
  })
}
