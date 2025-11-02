import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'

/**
 * Handler pour changer la clé API Riot
 *
 * Usage: /key <api_key>
 *
 * Comportement :
 * - Met à jour config.riotApiKey
 * - Réinitialise le timestamp et les rappels
 * - Affiche un message de confirmation avec info sur les rappels à venir
 *
 * @param msg - Message de commande
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function keyHandler(msg: Message, state: State, responses: Response[]): void {
  const sourceId = msg.sourceId
  const payload = msg.payload as { apiKey?: string } | undefined

  // Validation : apiKey requis
  if (!payload?.apiKey) {
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content: '❌ **Usage** : `/key <api_key>`\n\nExemple : `/key RGAPI-12345678-abcd-efgh-ijkl-123456789012`',
      ephemeral: true,
    })
    return
  }

  // Extraire et nettoyer la clé
  const newKey = payload.apiKey.trim()

  // Validation : format RGAPI-
  if (!newKey.startsWith('RGAPI-')) {
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content:
        '❌ **Clé API invalide** : la clé doit commencer par `RGAPI-`.\n\nExemple : `RGAPI-12345678-abcd-efgh-ijkl-123456789012`',
      ephemeral: true,
    })
    return
  }

  // Validation : longueur minimale
  if (newKey.length <= 6) {
    // "RGAPI-" = 6 caractères
    responses.push({
      type: MessageType.ERROR,
      targetId: sourceId,
      content: '❌ **Clé API invalide** : la clé est trop courte.',
      ephemeral: true,
    })
    return
  }

  // Type guard for ConfigService
  const isConfigService = 'getSync' in state.config

  // Vérifier si c'est la même clé
  const currentKey = isConfigService
    ? (state.config as any).getSync('riotApiKey')
    : (state.config as any).riotApiKey
  const isSameKey = currentKey === newKey

  // Mettre à jour la clé
  if (isConfigService) {
    ;(state.config as any).setSync('riotApiKey', newKey)
    ;(state.config as any).setSync('riotApiKeyUpdatedAt', new Date().toISOString())
    ;(state.config as any).setSync('riotApiKeyReminders', JSON.stringify([]))
  } else {
    ;(state.config as any).riotApiKey = newKey
    ;(state.config as any).riotApiKeyUpdatedAt = new Date()
    ;(state.config as any).riotApiKeyReminders = []
  }

  // Message de confirmation
  let message = '✅ **Clé API Riot mise à jour avec succès !**\n\n'

  if (isSameKey) {
    message += '⚠️ *Note : La clé est identique à l\'ancienne. Rappels réinitialisés.*\n\n'
  }

  message += `🔑 **Nouvelle clé** : \`${newKey}\`\n\n`
  message += '⏰ **Rappels automatiques** :\n'
  message += '   • **22h** après le changement\n'
  message += '   • **23h** après le changement\n'
  message += '   • **23h30** après le changement\n'
  message += '   • **24h** après le changement (expiration)\n\n'
  message += '💡 *Astuce : Changez la clé avant qu\'elle n\'expire pour éviter les interruptions.*'

  responses.push({
    type: MessageType.SUCCESS,
    targetId: sourceId,
    content: message,
    ephemeral: true,
  })
}
