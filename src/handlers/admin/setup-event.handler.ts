/**
 * Handler pour /setup event
 * Configure les dates de l'événement avec format simplifié
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatSetupEvent, formatError } from '../../formatters/embeds.js'

interface SetupEventPayload {
  startDate: string // Format: "1/11/2025" (DD/MM/YYYY)
  startHour: string // Format: "20:00" (HH:MM)
  endDate: string // Format: "30/11/2025" (DD/MM/YYYY)
  endHour: string // Format: "23:59" (HH:MM)
}

/**
 * Parse une date au format DD/MM/YYYY
 * Retourne { day, month, year } ou null si invalide
 */
function parseDate(dateStr: string): { day: number; month: number; year: number } | null {
  const parts = dateStr.trim().split('/')
  if (parts.length !== 3) return null

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  const year = parseInt(parts[2], 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null
  if (day < 1 || day > 31) return null
  if (month < 1 || month > 12) return null
  if (year < 2000 || year > 2100) return null

  return { day, month, year }
}

/**
 * Parse une heure au format HH:MM
 * Retourne { hours, minutes } ou null si invalide
 */
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  const parts = timeStr.trim().split(':')
  if (parts.length !== 2) return null

  const hours = parseInt(parts[0], 10)
  const minutes = parseInt(parts[1], 10)

  if (isNaN(hours) || isNaN(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null

  return { hours, minutes }
}

/**
 * Construit une date à partir de date + heure (timezone Europe/Paris implicite)
 */
function buildDate(
  dateStr: string,
  timeStr: string
): { date: Date; iso: string } | { error: string } {
  const parsedDate = parseDate(dateStr)
  if (!parsedDate) {
    return { error: `Format de date invalide: "${dateStr}". Utilisez le format: 1/11/2025` }
  }

  const parsedTime = parseTime(timeStr)
  if (!parsedTime) {
    return { error: `Format d'heure invalide: "${timeStr}". Utilisez le format: 20:00` }
  }

  // Construire la date en utilisant le constructeur Date
  // Note: les mois commencent à 0 en JavaScript (0 = janvier, 11 = décembre)
  const date = new Date(
    parsedDate.year,
    parsedDate.month - 1,
    parsedDate.day,
    parsedTime.hours,
    parsedTime.minutes,
    0,
    0
  )

  // Vérifier que la date est valide (détecte les dates impossibles comme 31/02/2025)
  if (
    isNaN(date.getTime()) ||
    date.getDate() !== parsedDate.day ||
    date.getMonth() !== parsedDate.month - 1 ||
    date.getFullYear() !== parsedDate.year
  ) {
    return { error: `Date invalide: ${dateStr} (vérifiez que la date existe dans le calendrier)` }
  }

  // Convertir en ISO string pour stockage
  const iso = date.toISOString()

  return { date, iso }
}

export async function handleSetupEvent(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { startDate, startHour, endDate, endHour } = message.payload as SetupEventPayload

  // Parser la date de début
  const startResult = buildDate(startDate, startHour)
  if ('error' in startResult) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(formatError({ error: `Date de début : ${startResult.error}` })),
      ephemeral: true,
    })
    return
  }

  // Parser la date de fin
  const endResult = buildDate(endDate, endHour)
  if ('error' in endResult) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(formatError({ error: `Date de fin : ${endResult.error}` })),
      ephemeral: true,
    })
    return
  }

  const start = startResult.date
  const end = endResult.date

  // Vérifier que la date de fin est après la date de début
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

  // Stocker dans le state (toujours en Europe/Paris)
  if ('setSync' in state.config) {
    state.config.setSync('eventStartDate', startResult.iso)
    state.config.setSync('eventEndDate', endResult.iso)
    state.config.setSync('eventTimezone', 'Europe/Paris')
  }

  // Response de succès
  const embed = formatSetupEvent({
    startDate: start,
    endDate: end,
    timezone: 'Europe/Paris',
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
