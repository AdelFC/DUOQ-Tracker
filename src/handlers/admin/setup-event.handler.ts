/**
 * Handler pour /setup event
 * Configure les dates de l'événement
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatSetupEvent, formatError } from '../../formatters/embeds.js'

interface SetupEventPayload {
  startDate: string
  endDate: string
  timezone: string
}

export async function handleSetupEvent(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { startDate, endDate, timezone } = message.payload as SetupEventPayload

  // Valider les dates
  const start = new Date(startDate)
  const end = new Date(endDate)

  if (isNaN(start.getTime())) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(
        formatError({ error: 'Date de début invalide. Format requis : ISO 8601 (ex: 2025-11-01T00:00:00Z)' })
      ),
      ephemeral: true,
    })
    return
  }

  if (isNaN(end.getTime())) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(
        formatError({ error: 'Date de fin invalide. Format requis : ISO 8601 (ex: 2025-11-30T23:59:59Z)' })
      ),
      ephemeral: true,
    })
    return
  }

  if (end <= start) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(
        formatError({ error: 'La date de fin doit être après la date de début.' })
      ),
      ephemeral: true,
    })
    return
  }

  // Calculer la durée
  const durationMs = end.getTime() - start.getTime()
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24))
  const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  // Vérifier si l'événement est actif
  const now = new Date()
  const isActive = now >= start && now <= end

  // Stocker dans le state
  if ('setSync' in state.config) {
    state.config.setSync('eventStartDate', startDate)
    state.config.setSync('eventEndDate', endDate)
    state.config.setSync('eventTimezone', timezone)
  }

  // Response de succès
  const embed = formatSetupEvent({
    startDate: start,
    endDate: end,
    timezone,
    durationDays,
    durationHours,
    isActive,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify(embed),
    ephemeral: false,
  })
}
