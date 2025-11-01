/**
 * Handler pour /setup reset
 * Réinitialise les données de l'événement (joueurs, duos, games)
 * Conserve la configuration (channels, dates, API key)
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { setupResetSuccessEmbed, setupResetConfirmationEmbed } from '../../formatters/index.js'

interface SetupResetPayload {
  confirm?: boolean // Sécurité: nécessite confirmation
}

export async function handleSetupReset(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const payload = message.payload as SetupResetPayload

  // Sécurité: demander confirmation
  if (!payload.confirm) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: setupResetConfirmationEmbed(),
      ephemeral: true,
    })
    return
  }

  // Sauvegarder les statistiques avant reset
  const playerCount = state.players.size
  const duoCount = state.duos.size
  const gameCount = state.games.size
  const devCount = state.devs.size

  // Réinitialiser les données
  state.players.clear()
  state.duos.clear()
  state.games.clear()
  state.devs.clear() // Également réinitialiser les devs

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: setupResetSuccessEmbed(
      playerCount,
      duoCount,
      gameCount,
      devCount,
      ['Configuration des channels', 'Dates de l\'événement', 'Clé API Riot']
    ),
    ephemeral: false,
  })
}
