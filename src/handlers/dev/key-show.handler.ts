/**
 * Handler pour /key show
 * Affiche la clé API Riot actuelle
 */

import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { State } from '../../types/state.js'

export function handleKeyShow(message: Message, state: State, responses: Response[]): void {
  // Handle both Config object and ConfigService
  const riotApiKey =
    typeof state.config === 'object' && 'getSync' in state.config
      ? state.config.getSync('riotApiKey')
      : (state.config as any).riotApiKey

  if (!riotApiKey) {
    responses.push({
      type: MessageType.INFO,
      targetId: message.sourceId,
      content: JSON.stringify({
        title: 'Clé API Riot',
        description: 'Aucune clé API Riot définie',
        fields: [
          {
            name: 'Status',
            value: 'Non configuré',
            inline: false,
          },
        ],
        color: 0xffa500,
        footer: {
          text: 'Utilisez /key set pour définir une clé API',
        },
      }),
      ephemeral: true,
    })
    return
  }

  // Get API key age
  const updatedAtStr =
    typeof state.config === 'object' && 'getSync' in state.config
      ? state.config.getSync('riotApiKeyUpdatedAt')
      : (state.config as any).riotApiKeyUpdatedAt

  let keyAge = 'Inconnu'
  let keyStatus = '⚠️ Âge inconnu'
  let embedColor = 0xffa500 // Orange

  if (updatedAtStr) {
    const updatedAt = typeof updatedAtStr === 'string' ? new Date(updatedAtStr) : updatedAtStr
    const now = Date.now()
    const ageMs = now - updatedAt.getTime()
    const ageHours = ageMs / (60 * 60 * 1000)
    const ageMinutes = ageMs / (60 * 1000)

    // Format age
    if (ageHours >= 1) {
      keyAge = `${ageHours.toFixed(1)} heures`
    } else {
      keyAge = `${Math.floor(ageMinutes)} minutes`
    }

    // Determine status and color
    if (ageHours >= 24) {
      keyStatus = '🚨 EXPIRÉ'
      embedColor = 0xff0000 // Red
    } else if (ageHours >= 23) {
      keyStatus = '⚠️ Critique'
      embedColor = 0xff6600 // Orange-red
    } else if (ageHours >= 22) {
      keyStatus = '⏰ Attention'
      embedColor = 0xffa500 // Orange
    } else {
      keyStatus = '✅ Actif'
      embedColor = 0x00ff00 // Green
    }
  }

  // Masquer la clé en n'affichant que les premiers et derniers caractères
  const maskedKey =
    riotApiKey.length > 10
      ? `${riotApiKey.substring(0, 8)}${'*'.repeat(riotApiKey.length - 16)}${riotApiKey.substring(riotApiKey.length - 8)}`
      : `${riotApiKey.substring(0, 2)}${'*'.repeat(riotApiKey.length - 4)}${riotApiKey.substring(riotApiKey.length - 2)}`

  responses.push({
    type: MessageType.SUCCESS,
    targetId: message.sourceId,
    content: JSON.stringify({
      title: 'Clé API Riot',
      description: 'Informations sur la clé API Riot configurée',
      fields: [
        {
          name: 'Clé masquée',
          value: `\`${maskedKey}\``,
          inline: false,
        },
        {
          name: 'Status',
          value: keyStatus,
          inline: true,
        },
        {
          name: 'Âge',
          value: keyAge,
          inline: true,
        },
      ],
      color: embedColor,
      footer: {
        text: 'Les clés API Riot expirent après 24 heures',
      },
    }),
    ephemeral: true,
  })
}
