/**
 * Challenge End Service
 *
 * Gère les annonces de fin de challenge et la désactivation automatique
 * - Vérifie toutes les heures si la date de fin approche
 * - Envoie des rappels progressifs (J-7, J-3, J-1, H-24, H-12, H-6, H-1)
 * - Annonce la fin du challenge avec classement final
 * - Désactive automatiquement le challenge
 */

import type { Client } from 'discord.js'
import { EmbedBuilder } from 'discord.js'
import type { State } from '../types/state.js'
import { COLORS, EMOJIS } from '../constants/lore.js'

interface ReminderConfig {
  key: string
  timeBeforeEnd: number // millisecondes avant la fin
  message: string
  color: number
}

const REMINDERS: ReminderConfig[] = [
  {
    key: '7days',
    timeBeforeEnd: 7 * 24 * 60 * 60 * 1000, // 7 jours
    message: '🗓️ **Plus que 7 jours** avant la fin du challenge !',
    color: COLORS.info,
  },
  {
    key: '3days',
    timeBeforeEnd: 3 * 24 * 60 * 60 * 1000, // 3 jours
    message: '⏰ **Plus que 3 jours** ! Le sprint final commence !',
    color: COLORS.warning,
  },
  {
    key: '1day',
    timeBeforeEnd: 24 * 60 * 60 * 1000, // 1 jour
    message: '🔥 **Dernières 24 heures** ! C\'est le moment de tout donner !',
    color: COLORS.streak,
  },
  {
    key: '12hours',
    timeBeforeEnd: 12 * 60 * 60 * 1000, // 12 heures
    message: '⚡ **Plus que 12 heures** ! La fin approche !',
    color: COLORS.epic,
  },
  {
    key: '6hours',
    timeBeforeEnd: 6 * 60 * 60 * 1000, // 6 heures
    message: '⏳ **Plus que 6 heures** ! Dernière ligne droite !',
    color: COLORS.legendary,
  },
  {
    key: '1hour',
    timeBeforeEnd: 60 * 60 * 1000, // 1 heure
    message: '🚨 **DERNIÈRE HEURE** ! Ultime rush avant la fin !',
    color: COLORS.error,
  },
]

export class ChallengeEndService {
  private intervalId: NodeJS.Timeout | null = null
  private sentReminders = new Set<string>()

  constructor(
    private client: Client,
    private state: State,
    private checkIntervalMs: number = 60 * 60 * 1000 // Default: 1 heure
  ) {
    this.loadSentReminders()
  }

  /**
   * Charger les rappels déjà envoyés depuis la config
   */
  private loadSentReminders(): void {
    const sentRemindersJson =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? this.state.config.getSync('challengeEndReminders')
        : null

    if (sentRemindersJson) {
      try {
        const reminders = JSON.parse(sentRemindersJson)
        this.sentReminders = new Set(reminders)
      } catch (error) {
        console.error('[ChallengeEnd] Failed to parse sent reminders:', error)
      }
    }
  }

  /**
   * Sauvegarder les rappels envoyés dans la config
   */
  private saveSentReminders(): void {
    if ('setSync' in this.state.config) {
      const remindersArray = Array.from(this.sentReminders)
      this.state.config.setSync('challengeEndReminders', JSON.stringify(remindersArray))
    }
  }

  /**
   * Démarrer le service
   */
  start(): void {
    if (this.intervalId) {
      console.log('[ChallengeEnd] Already running')
      return
    }

    console.log(`[ChallengeEnd] Started (checking every ${this.checkIntervalMs / 1000}s)`)

    // Check immédiat au démarrage
    this.check()

    // Puis check à intervalle régulier
    this.intervalId = setInterval(() => {
      this.check()
    }, this.checkIntervalMs)
  }

  /**
   * Arrêter le service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[ChallengeEnd] Stopped')
    }
  }

  /**
   * Vérifier si le service est actif
   */
  isRunning(): boolean {
    return this.intervalId !== null
  }

  /**
   * Vérification principale
   */
  private async check(): Promise<void> {
    // Récupérer la date de fin du challenge
    const eventEndDate =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? this.state.config.getSync('eventEndDate')
        : null

    if (!eventEndDate) {
      // Pas de date de fin configurée
      return
    }

    const endDate = new Date(eventEndDate)
    const now = new Date()
    const timeUntilEnd = endDate.getTime() - now.getTime()

    // Challenge déjà terminé ?
    if (timeUntilEnd < 0) {
      // Vérifier si on a déjà envoyé l'annonce de fin
      if (!this.sentReminders.has('ended')) {
        await this.announceEnd()
        this.sentReminders.add('ended')
        this.saveSentReminders()
      }
      return
    }

    // Vérifier les rappels à envoyer
    for (const reminder of REMINDERS) {
      // Déjà envoyé ?
      if (this.sentReminders.has(reminder.key)) {
        continue
      }

      // Temps écoulé pour ce rappel ?
      if (timeUntilEnd <= reminder.timeBeforeEnd) {
        await this.sendReminder(reminder)
        this.sentReminders.add(reminder.key)
        this.saveSentReminders()
      }
    }
  }

  /**
   * Envoyer un rappel
   */
  private async sendReminder(reminder: ReminderConfig): Promise<void> {
    const trackerChannelId =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? this.state.config.getSync('trackerChannelId')
        : null

    if (!trackerChannelId) {
      console.warn('[ChallengeEnd] No tracker channel configured')
      return
    }

    try {
      const embed = new EmbedBuilder()
        .setTitle('⏰ Rappel de fin de challenge')
        .setDescription(reminder.message)
        .setColor(reminder.color)
        .addFields({
          name: '📊 Classement actuel',
          value: 'Utilisez `/ladder` pour voir le classement',
          inline: false,
        })
        .setFooter({ text: 'DuoQ Tracker' })
        .setTimestamp()

      const channel = await this.client.channels.fetch(trackerChannelId)
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send({ embeds: [embed] })
        console.log(`[ChallengeEnd] Sent reminder: ${reminder.key}`)
      }
    } catch (error) {
      console.error('[ChallengeEnd] Error sending reminder:', error)
    }
  }

  /**
   * Annoncer la fin du challenge
   */
  private async announceEnd(): Promise<void> {
    const trackerChannelId =
      typeof this.state.config === 'object' && 'getSync' in this.state.config
        ? this.state.config.getSync('trackerChannelId')
        : null

    if (!trackerChannelId) {
      console.warn('[ChallengeEnd] No tracker channel configured')
      return
    }

    try {
      // Récupérer le TOP 3 des duos
      const duos = Array.from(this.state.duos.values())
      const sortedDuos = duos
        .filter((duo) => duo.gamesPlayed > 0)
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .slice(0, 3)

      // Construire le message de podium
      let podiumText = ''
      const medals = ['🥇', '🥈', '🥉']

      for (let i = 0; i < sortedDuos.length; i++) {
        const duo = sortedDuos[i]
        const noob = this.state.players.get(duo.noobId)
        const carry = this.state.players.get(duo.carryId)

        if (noob && carry) {
          const winrate =
            duo.gamesPlayed > 0 ? Math.round((duo.wins / duo.gamesPlayed) * 100) : 0

          podiumText += `\n${medals[i]} **${duo.name}**\n`
          podiumText += `└─ ${noob.gameName} & ${carry.gameName}\n`
          podiumText += `└─ ${duo.totalPoints} pts • ${duo.wins}W/${duo.losses}L (${winrate}%)\n`
        }
      }

      if (!podiumText) {
        podiumText = '\n*Aucun duo n\'a joué de game*'
      }

      // Embed principal
      const embed = new EmbedBuilder()
        .setTitle('🏆 FIN DU CHALLENGE DUOQ 🏆')
        .setDescription(
          `Le challenge est officiellement terminé !\n\nBravo à tous les participants pour votre persévérance et votre détermination ! ${EMOJIS.party}`
        )
        .setColor(COLORS.legendary)
        .addFields({
          name: '👑 Podium Final',
          value: podiumText,
          inline: false,
        })
        .addFields({
          name: '📊 Statistiques',
          value: `**${duos.length}** duos inscrits\n**${this.state.games.size}** games jouées`,
          inline: false,
        })
        .setFooter({
          text: 'Merci à tous les participants ! GG WP !',
        })
        .setTimestamp()

      const channel = await this.client.channels.fetch(trackerChannelId)
      if (channel && channel.isTextBased() && 'send' in channel) {
        await (channel as any).send({
          content: '@everyone',
          embeds: [embed],
        })
        console.log('[ChallengeEnd] Challenge ended, announcement sent')
      }

      // Désactiver le challenge
      if ('setSync' in this.state.config) {
        this.state.config.setSync('isActive', 'false')
        console.log('[ChallengeEnd] Challenge deactivated')
      }
    } catch (error) {
      console.error('[ChallengeEnd] Error announcing end:', error)
    }
  }

  /**
   * Reset les rappels envoyés (pour les tests ou nouveau challenge)
   */
  resetReminders(): void {
    this.sentReminders.clear()
    this.saveSentReminders()
    console.log('[ChallengeEnd] Reminders reset')
  }
}
