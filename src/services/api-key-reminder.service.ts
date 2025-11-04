/**
 * API Key Reminder Service
 *
 * Checks API key age every hour and sends reminders to devs
 * at 22h, 23h, 23h30, and 24h thresholds
 */

import schedule from 'node-schedule'
import type { Client } from 'discord.js'
import type { State } from '../types/state.js'

export class ApiKeyReminderService {
  private job: schedule.Job | null = null

  constructor(
    private client: Client,
    private state: State
  ) {}

  /**
   * Start the API key reminder checking job
   * Runs every hour
   */
  start(): void {
    // Stop existing job if any
    this.stop()

    // Schedule every hour at minute 0
    // Cron: "0 * * * *" = At minute 0 of every hour
    this.job = schedule.scheduleJob('0 * * * *', () => this.checkApiKeyAge())

    console.log('⏰ API key reminder service started (checks every hour)')
  }

  /**
   * Stop the API key reminder job
   */
  stop(): void {
    if (this.job) {
      this.job.cancel()
      this.job = null
      console.log('⏰ API key reminder service stopped')
    }
  }

  /**
   * Check API key age and send reminders if needed
   * Can be called manually for testing
   */
  async checkApiKeyAge(): Promise<void> {
    try {
      const { config, devs } = this.state

      // Type guard for ConfigService
      const isConfigService = 'getSync' in config

      // Get riotApiKeyUpdatedAt
      const updatedAtStr = isConfigService
        ? (config as any).getSync('riotApiKeyUpdatedAt')
        : (config as any).riotApiKeyUpdatedAt

      // Check if we have an API key and timestamp
      if (!updatedAtStr) {
        return // No key configured
      }

      const updatedAt = typeof updatedAtStr === 'string' ? new Date(updatedAtStr) : updatedAtStr

      // Check if we have devs to notify
      if (devs.size === 0) {
        console.warn('⚠️ API key reminder: No devs registered')
        return
      }

      // Calculate key age in hours
      const now = Date.now()
      const keyAge = now - updatedAt.getTime()
      const keyAgeHours = keyAge / (60 * 60 * 1000)

      // Get previous reminders
      const remindersStr = isConfigService
        ? (config as any).getSync('riotApiKeyReminders')
        : (config as any).riotApiKeyReminders

      let reminders: Date[] = []
      if (remindersStr) {
        reminders = typeof remindersStr === 'string' ? JSON.parse(remindersStr) : remindersStr
      }

      // Determine which reminder to send
      let reminderType: '22h' | '23h' | '23h30' | '24h' | null = null

      if (keyAgeHours >= 24 && reminders.length < 4) {
        reminderType = '24h'
      } else if (keyAgeHours >= 23.5 && reminders.length < 3) {
        reminderType = '23h30'
      } else if (keyAgeHours >= 23 && reminders.length < 2) {
        reminderType = '23h'
      } else if (keyAgeHours >= 22 && reminders.length < 1) {
        reminderType = '22h'
      }

      // If no reminder to send, exit
      if (!reminderType) {
        return
      }

      // Record the reminder
      reminders.push(new Date())
      if (isConfigService) {
        ;(config as any).setSync('riotApiKeyReminders', JSON.stringify(reminders))
      } else {
        ;(config as any).riotApiKeyReminders = reminders
      }

      // Get riotApiKey for display
      const riotApiKey = isConfigService ? (config as any).getSync('riotApiKey') : (config as any).riotApiKey

      // Generate message based on reminder type
      let message: string

      switch (reminderType) {
        case '22h':
          message = `⏰ **Rappel Clé API Riot**

La clé API a **22 heures**. Elle expirera dans **2 heures**.

🔑 Clé actuelle : \`${riotApiKey}\`

💡 *Pensez à la changer avant l'expiration pour éviter les interruptions du tracking.*

📝 Commande : \`/key <nouvelle_clé>\``
          break

        case '23h':
          message = `⏰ **Rappel Clé API Riot**

La clé API a **23 heures**. Elle expirera dans **1 heure**.

🔑 Clé actuelle : \`${riotApiKey}\`

💡 *Il est temps de changer la clé !*

📝 Commande : \`/key <nouvelle_clé>\``
          break

        case '23h30':
          message = `⚠️ **WARNING - Clé API Riot**

La clé API a **23h30**. Elle expirera dans **30 minutes** !

🔑 Clé actuelle : \`${riotApiKey}\`

🚨 *Changez la clé MAINTENANT pour éviter l'interruption du service !*

📝 Commande : \`/key <nouvelle_clé>\``
          break

        case '24h':
          message = `🚨 **CRITIQUE - Clé API Riot EXPIRÉE**

La clé API a **24 heures** et est maintenant **expirée** !

🔑 Clé actuelle : \`${riotApiKey}\`

❌ *Le tracking de games est actuellement INTERROMPU.*

📝 Commande URGENTE : \`/key <nouvelle_clé>\``
          break
      }

      // Create mentions list (@dev1 @dev2)
      const mentions = Array.from(devs.values())
        .map((dev) => `<@${dev.userId}>`)
        .join(' ')

      // Send DM to all devs with mentions
      for (const dev of devs.values()) {
        try {
          const user = await this.client.users.fetch(dev.userId)
          if (user) {
            await user.send(`${mentions}\n\n${message}`)
            console.log(`✅ API key reminder (${reminderType}) sent to dev ${dev.userId}`)
          }
        } catch (error) {
          console.error(`❌ Failed to send API key reminder to dev ${dev.userId}:`, error)
        }
      }
    } catch (error) {
      console.error('❌ Error checking API key age:', error)
    }
  }

  /**
   * Check if the service is running
   */
  isRunning(): boolean {
    return this.job !== null
  }

  /**
   * Get next scheduled run time
   */
  getNextRun(): Date | null {
    const nextInvocation = this.job?.nextInvocation()
    // Convert CronDate to Date if available
    return nextInvocation ? new Date(nextInvocation.toString()) : null
  }
}
