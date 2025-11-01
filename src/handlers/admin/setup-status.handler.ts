/**
 * Handler pour /setup status
 * Affiche la configuration actuelle du challenge
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatSetupStatus } from '../../formatters/embeds.js'

export async function handleSetupStatus(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  // Récupérer la configuration
  const generalChannelId = 'getSync' in state.config ? state.config.getSync('generalChannelId') : null
  const trackerChannelId = 'getSync' in state.config ? state.config.getSync('trackerChannelId') : null
  const eventStartDate = 'getSync' in state.config ? state.config.getSync('eventStartDate') : null
  const eventEndDate = 'getSync' in state.config ? state.config.getSync('eventEndDate') : null
  const eventTimezone = 'getSync' in state.config ? state.config.getSync('eventTimezone') : 'Europe/Paris'

  // Vérifier si l'événement est actif
  let isActive = false
  if (eventStartDate && eventEndDate) {
    const now = new Date()
    const start = new Date(eventStartDate)
    const end = new Date(eventEndDate)
    isActive = now >= start && now <= end
  }

  // Formater les dates
  const startDate = eventStartDate ? new Date(eventStartDate) : null
  const endDate = eventEndDate ? new Date(eventEndDate) : null

  const embed = formatSetupStatus({
    hasChannels: !!(generalChannelId && trackerChannelId),
    hasEvent: !!(eventStartDate && eventEndDate),
    generalChannelId,
    trackerChannelId,
    startDate,
    endDate,
    timezone: eventTimezone as string,
    isActive,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: message.sourceId,
    content: JSON.stringify(embed),
    ephemeral: false,
  })
}
