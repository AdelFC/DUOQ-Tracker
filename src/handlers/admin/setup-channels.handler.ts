/**
 * Handler: /setup channels
 * Configure les channels Discord utilisés par le bot
 */

import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'
import { setupChannelsSuccessEmbed, setupChannelsIdenticalErrorEmbed, errorEmbed } from '../../formatters/index.js'

interface SetupChannelsPayload {
  generalChannelId: string
  trackerChannelId: string
}

/**
 * Handler pour /setup channels
 * Configure les channels Discord (general + tracker)
 */
export async function handleSetupChannels(
  message: Message,
  state: State,
  responses: Response[]
): Promise<void> {
  const { generalChannelId, trackerChannelId } = message.payload as SetupChannelsPayload

  // Validation: les channels doivent être différents
  if (generalChannelId === trackerChannelId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: setupChannelsIdenticalErrorEmbed(),
      ephemeral: true,
    })
    return
  }

  // Validation: les IDs doivent être non vides
  if (!generalChannelId || !trackerChannelId) {
    responses.push({
      type: MessageType.ERROR,
      targetId: message.sourceId,
      content: errorEmbed('Channels requis', 'Les deux channels (général et tracker) sont requis pour configurer le bot.'),
      ephemeral: true,
    })
    return
  }

  // Stocker dans le state
  if ('set' in state.config) {
    await state.config.set('generalChannelId', generalChannelId)
    await state.config.set('trackerChannelId', trackerChannelId)
  }

  // Response de succès avec embed
  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: setupChannelsSuccessEmbed(generalChannelId, trackerChannelId),
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
}
