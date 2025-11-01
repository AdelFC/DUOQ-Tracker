/**
 * Daily Ladder Scheduler
 * Poste automatiquement le classement quotidien dans le tracker channel
 */

import type { State } from '../../types/state.js'
import type { Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import { formatDailyLadder } from '../../formatters/embeds.js'

export class DailyLadderScheduler {
  private intervalId: NodeJS.Timeout | null = null
  private state: State
  private responses: Response[]
  private lastPostDate: Date | null = null

  constructor(state: State, responses: Response[]) {
    this.state = state
    this.responses = responses
  }

  /**
   * Démarre le scheduler
   * Vérifie toutes les heures si on doit poster le ladder quotidien
   */
  start(): void {
    if (this.intervalId) {
      console.log('[DailyLadder] Scheduler already running')
      return
    }

    console.log('[DailyLadder] Scheduler started')

    // Vérifier immédiatement
    this.checkAndPost()

    // Puis vérifier toutes les heures
    this.intervalId = setInterval(() => {
      this.checkAndPost()
    }, 60 * 60 * 1000) // 1 heure
  }

  /**
   * Arrête le scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[DailyLadder] Scheduler stopped')
    }
  }

  /**
   * Vérifie si on doit poster le ladder et le poste si nécessaire
   */
  private async checkAndPost(): Promise<void> {
    const now = new Date()

    // Vérifier si l'événement est actif
    const isActive = await this.state.config.isEventActive()
    if (!isActive) {
      return
    }

    // Récupérer le tracker channel
    const trackerChannelId = await this.state.config.get('trackerChannelId')
    if (!trackerChannelId) {
      return
    }

    // Vérifier si on a déjà posté aujourd'hui
    if (this.lastPostDate) {
      const lastPostDay = this.lastPostDate.toDateString()
      const currentDay = now.toDateString()

      if (lastPostDay === currentDay) {
        // Déjà posté aujourd'hui
        return
      }
    }

    // Vérifier l'heure (poster à 20h Paris time)
    const timezone = (await this.state.config.get('eventTimezone')) || 'Europe/Paris'
    const currentHour = now.toLocaleString('fr-FR', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    })

    const hour = parseInt(currentHour)
    if (hour !== 20) {
      // Pas encore 20h
      return
    }

    // Poster le ladder quotidien
    await this.postDailyLadder(trackerChannelId, now)
    this.lastPostDate = now
  }

  /**
   * Poste le ladder quotidien dans le tracker channel
   */
  private async postDailyLadder(channelId: string, date: Date): Promise<void> {
    // Récupérer tous les duos
    const allDuos = Array.from(this.state.duos.values())

    // Trier par totalPoints DESC
    allDuos.sort((a, b) => b.totalPoints - a.totalPoints)

    // Ne prendre que le top 10
    const topDuos = allDuos.slice(0, 10).map((duo, index) => {
      const noob = this.state.players.get(duo.noobId)
      const carry = this.state.players.get(duo.carryId)

      return {
        rank: index + 1,
        duoName: duo.name,
        noobName: noob?.gameName || 'Unknown',
        carryName: carry?.gameName || 'Unknown',
        totalPoints: duo.totalPoints,
        wins: duo.wins,
        losses: duo.losses,
      }
    })

    // Créer l'embed avec le formatter
    const embed = formatDailyLadder({
      topDuos,
      date,
    })

    // Envoyer dans le tracker channel
    this.responses.push({
      type: MessageType.INFO,
      targetId: channelId,
      content: JSON.stringify(embed),
      ephemeral: false,
    })

    console.log(`[DailyLadder] Posted daily ladder with ${topDuos.length} duos`)
  }

  /**
   * Force le post du ladder quotidien (pour tests)
   */
  async forcePost(): Promise<void> {
    const trackerChannelId = await this.state.config.get('trackerChannelId')
    if (!trackerChannelId) {
      throw new Error('Tracker channel not configured')
    }

    await this.postDailyLadder(trackerChannelId, new Date())
    this.lastPostDate = new Date()
  }
}
