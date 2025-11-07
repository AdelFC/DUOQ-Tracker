/**
 * Handler pour /setup channels
 * Configure les channels Discord (general + tracker + dev optionnel)
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { formatSetupChannels, formatError } from '../../formatters/embeds.js'

interface SetupChannelsPayload {
  generalChannelId: string
  trackerChannelId: string
  devChannelId: string | null
}

export async function handleSetupChannels(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { generalChannelId, trackerChannelId, devChannelId } = message.payload as SetupChannelsPayload

  // Validation: les channels doivent être différents
  if (generalChannelId === trackerChannelId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(
        formatError({ error: 'Les channels général et tracker doivent être différents.' })
      ),
      ephemeral: true,
    })
    return
  }

  // Validation: les IDs doivent être non vides
  if (!generalChannelId || !trackerChannelId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: JSON.stringify(
        formatError({ error: 'Les deux channels (général et tracker) sont requis.' })
      ),
      ephemeral: true,
    })
    return
  }

  // Stocker dans le state
  if ('setSync' in state.config) {
    state.config.setSync('generalChannelId', generalChannelId)
    state.config.setSync('trackerChannelId', trackerChannelId)
    if (devChannelId) {
      state.config.setSync('devChannelId', devChannelId)
    }
  }

  // Response de succès avec embed
  const embed = formatSetupChannels({
    generalChannelId,
    trackerChannelId,
    devChannelId: devChannelId || undefined,
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify(embed),
    ephemeral: false,
  })

  // Messages de test dans les channels
  responses.push({
    type: MessageType.INFO,
    targetId: generalChannelId,
    content: '✅ Channel configuré pour les **interactions** (commandes, réponses)',
    ephemeral: false,
  })

  responses.push({
    type: MessageType.INFO,
    targetId: trackerChannelId,
    content: '✅ Channel configuré pour les **notifications automatiques** (games, ladder)',
    ephemeral: false,
  })

  if (devChannelId) {
    responses.push({
      type: MessageType.INFO,
      targetId: devChannelId,
      content: '✅ Channel configuré pour les **logs de scoring détaillés**',
      ephemeral: false,
    })
  }
}
