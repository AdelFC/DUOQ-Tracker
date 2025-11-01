/**
 * Handler pour /setup status
 * Affiche la configuration actuelle du challenge
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { setupStatusEmbed } from '../../formatters/index.js'

export async function handleSetupStatus(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  // Récupérer la configuration
  const generalChannelId = await state.config.get('generalChannelId')
  const trackerChannelId = await state.config.get('trackerChannelId')
  const eventStartDate = await state.config.get('eventStartDate')
  const eventEndDate = await state.config.get('eventEndDate')
  const eventTimezone = await state.config.get('eventTimezone')
  const riotApiKey = await state.config.get('riotApiKey')

  // Vérifier si l'événement est actif
  const isActive = await state.config.isEventActive()

  // Compter les stats
  const playerCount = state.players.size
  const duoCount = state.duos.size
  const gameCount = state.games.size

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: setupStatusEmbed(
      generalChannelId,
      trackerChannelId,
      eventStartDate,
      eventEndDate,
      eventTimezone,
      riotApiKey,
      isActive,
      playerCount,
      duoCount,
      gameCount
    ),
    ephemeral: false,
  })
}
