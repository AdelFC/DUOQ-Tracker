/**
 * Handler pour /setup event
 * Configure les dates de début et fin de l'événement
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { setupEventSuccessEmbed, setupEventErrorEmbed, setupEventPastDateWarningEmbed, errorEmbed } from '../../formatters/index.js'

interface SetupEventPayload {
  startDate: string // ISO 8601 format
  endDate: string // ISO 8601 format
  timezone?: string // Optional, default: Europe/Paris
}

export async function handleSetupEvent(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const payload = message.payload as SetupEventPayload

  // Validation: dates requises
  if (!payload.startDate || !payload.endDate) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: errorEmbed('Dates requises', 'Les dates de début et de fin sont requises.\n\nUtilisation: `/setup event start:<date> end:<date> [timezone:<tz>]`'),
      ephemeral: true,
    })
    return
  }

  // Validation: formats de dates
  let startDate: Date
  let endDate: Date

  try {
    startDate = new Date(payload.startDate)
    endDate = new Date(payload.endDate)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format')
    }
  } catch (error) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: setupEventErrorEmbed('Format de date invalide'),
      ephemeral: true,
    })
    return
  }

  // Validation: date de début < date de fin
  if (startDate >= endDate) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: setupEventErrorEmbed('La date de début doit être antérieure à la date de fin'),
      ephemeral: true,
    })
    return
  }

  // Validation: dates dans le futur (optionnel, peut être retiré pour les tests)
  const now = new Date()
  if (endDate < now) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: setupEventPastDateWarningEmbed(),
      ephemeral: true,
    })
    // Continue quand même pour permettre les tests
  }

  // Stocker la configuration
  const timezone = payload.timezone || 'Europe/Paris'
  if ('set' in state.config) {
    await state.config.set('eventStartDate', payload.startDate)
    await state.config.set('eventEndDate', payload.endDate)
    await state.config.set('eventTimezone', timezone)
  }

  // Calculer la durée
  const durationMs = endDate.getTime() - startDate.getTime()
  const durationDays = Math.floor(durationMs / (1000 * 60 * 60 * 24))
  const durationHours = Math.floor((durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  // Utiliser le nouveau formatter
  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: setupEventSuccessEmbed(
      payload.startDate,
      payload.endDate,
      timezone,
      durationDays,
      durationHours
    ),
    ephemeral: false,
  })
}
