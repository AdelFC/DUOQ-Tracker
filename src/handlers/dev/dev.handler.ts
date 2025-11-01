import type { Message, Response } from '../../types/message.js'
import type { State } from '../../types/state.js'
import { MessageType } from '../../types/message.js'

/**
 * Handler pour authentifier un développeur
 *
 * Usage: /dev
 *
 * Comportement :
 * - Enregistre le développeur dans state.devs
 * - Les devs enregistrés recevront les rappels de clé API
 * - Affiche la liste des commandes disponibles
 *
 * @param msg - Message de commande
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function devHandler(msg: Message, state: State, responses: Response[]): void {
  const sourceId = msg.sourceId
  const payload = msg.payload as { username?: string } | undefined

  const username = payload?.username?.trim() || 'Inconnu'

  // Vérifier si le dev est déjà enregistré
  const existingDev = state.devs.get(sourceId)

  if (existingDev) {
    // Mettre à jour le username et le timestamp
    existingDev.username = username
    existingDev.registeredAt = new Date()

    responses.push({
      type: MessageType.SUCCESS,
      targetId: sourceId,
      content: `✅ **${username}**, tu es déjà authentifié en tant que développeur.

🔔 **Rappels actifs** : Tu recevras les notifications de clé API à 22h, 23h, 23h30 et 24h.

📋 **Commandes disponibles** :
   • \`/key <api_key>\` - Changer la clé API Riot
   • \`/devlist\` - Lister les devs authentifiés`,
      ephemeral: true,
    })
    return
  }

  // Enregistrer le nouveau dev
  state.devs.set(sourceId, {
    userId: sourceId,
    username,
    registeredAt: new Date(),
  })

  responses.push({
    type: MessageType.SUCCESS,
    targetId: sourceId,
    content: `🎉 **Bienvenue ${username} !**

✅ Tu es maintenant authentifié en tant que développeur.

🔔 **Rappels automatiques** : Tu recevras des notifications quand la clé API Riot approche de son expiration :
   • **22h** après le dernier changement
   • **23h** après le dernier changement
   • **23h30** après le dernier changement (warning)
   • **24h** après le dernier changement (expiration)

📋 **Commandes disponibles** :
   • \`/key <api_key>\` - Changer la clé API Riot
   • \`/devlist\` - Lister les devs authentifiés

💡 *Astuce : Ces rappels permettent d'éviter les interruptions du tracking de games.*`,
    ephemeral: true,
  })
}
