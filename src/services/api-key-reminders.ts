import { State, Response } from '../types'

/**
 * Service de rappels automatiques pour la clé API Riot
 *
 * Vérifie l'âge de la clé API et envoie des rappels aux devs authentifiés
 * aux seuils suivants :
 * - 22h après le changement
 * - 23h après le changement
 * - 23h30 après le changement (warning)
 * - 24h après le changement (expiration critique)
 *
 * @param state - État global
 * @param responses - Tableau de réponses à envoyer
 */
export function checkApiKeyReminders(state: State, responses: Response[]): void {
  const { config, devs } = state

  // Vérifier qu'on a une clé API et un timestamp
  if (!config.riotApiKeyUpdatedAt) {
    return // Pas de clé configurée
  }

  // Vérifier qu'on a des devs à notifier
  if (devs.size === 0) {
    return // Aucun dev enregistré
  }

  // Calculer l'âge de la clé en heures
  const now = Date.now()
  const keyAge = now - config.riotApiKeyUpdatedAt.getTime()
  const keyAgeHours = keyAge / (60 * 60 * 1000)

  // Initialiser les rappels si nécessaire
  if (!config.riotApiKeyReminders) {
    config.riotApiKeyReminders = []
  }

  // Déterminer quel rappel envoyer
  let reminderType: '22h' | '23h' | '23h30' | '24h' | null = null

  if (keyAgeHours >= 24 && config.riotApiKeyReminders.length < 4) {
    reminderType = '24h'
  } else if (keyAgeHours >= 23.5 && config.riotApiKeyReminders.length < 3) {
    reminderType = '23h30'
  } else if (keyAgeHours >= 23 && config.riotApiKeyReminders.length < 2) {
    reminderType = '23h'
  } else if (keyAgeHours >= 22 && config.riotApiKeyReminders.length < 1) {
    reminderType = '22h'
  }

  // Si aucun rappel à envoyer, sortir
  if (!reminderType) {
    return
  }

  // Enregistrer le rappel
  config.riotApiKeyReminders.push(new Date())

  // Générer le message selon le type de rappel
  let message: string

  switch (reminderType) {
    case '22h':
      message = `⏰ **Rappel Clé API Riot**

La clé API a **22 heures**. Elle expirera dans **2 heures**.

🔑 Clé actuelle : \`${config.riotApiKey}\`

💡 *Pensez à la changer avant l'expiration pour éviter les interruptions du tracking.*

📝 Commande : \`/key <nouvelle_clé>\``
      break

    case '23h':
      message = `⏰ **Rappel Clé API Riot**

La clé API a **23 heures**. Elle expirera dans **1 heure**.

🔑 Clé actuelle : \`${config.riotApiKey}\`

💡 *Il est temps de changer la clé !*

📝 Commande : \`/key <nouvelle_clé>\``
      break

    case '23h30':
      message = `⚠️ **WARNING - Clé API Riot**

La clé API a **23h30**. Elle expirera dans **30 minutes** !

🔑 Clé actuelle : \`${config.riotApiKey}\`

🚨 *Changez la clé MAINTENANT pour éviter l'interruption du service !*

📝 Commande : \`/key <nouvelle_clé>\``
      break

    case '24h':
      message = `🚨 **CRITIQUE - Clé API Riot EXPIRÉE**

La clé API a **24 heures** et est maintenant **expirée** !

🔑 Clé actuelle : \`${config.riotApiKey}\`

❌ *Le tracking de games est actuellement INTERROMPU.*

📝 Commande URGENTE : \`/key <nouvelle_clé>\``
      break
  }

  // Créer la liste des mentions (@dev1 @dev2)
  const mentions = Array.from(devs.values())
    .map((dev) => `<@${dev.userId}>`)
    .join(' ')

  // Envoyer le message à tous les devs avec mentions
  for (const dev of devs.values()) {
    responses.push({
      recipientId: dev.userId,
      content: `${mentions}\n\n${message}`,
    })
  }
}
