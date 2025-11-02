/**
 * Daily Ladder Service
 *
 * Posts the daily ladder to the tracker channel at 19:00 Europe/Paris
 */

import schedule from 'node-schedule'
import type { Client } from 'discord.js'
import type { State } from '../types/state.js'
import { formatDailyLadder } from '../formatters/embeds.js'
import type { Duo } from '../types/duo.js'

export class DailyLadderService {
  private job: schedule.Job | null = null

  constructor(
    private client: Client,
    private state: State
  ) {}

  /**
   * Start the daily ladder posting job
   * Runs every day at 19:00 Europe/Paris
   */
  start(): void {
    // Stop existing job if any
    this.stop()

    // Schedule daily at 19:00 Europe/Paris
    // Cron: "0 19 * * *" = At minute 0 of hour 19 (7 PM) every day
    this.job = schedule.scheduleJob(
      { hour: 19, minute: 0, tz: 'Europe/Paris' },
      () => this.postDailyLadder()
    )

    console.log('📅 Daily ladder service started (19:00 Europe/Paris)')
  }

  /**
   * Stop the daily ladder posting job
   */
  stop(): void {
    if (this.job) {
      this.job.cancel()
      this.job = null
      console.log('📅 Daily ladder service stopped')
    }
  }

  /**
   * Post the daily ladder to the tracker channel
   * Can be called manually for testing
   */
  async postDailyLadder(): Promise<void> {
    try {
      // Get tracker channel ID from config
      const trackerChannelId = await (this.state.config as any).get('trackerChannelId')

      if (!trackerChannelId) {
        console.warn('⚠️ Daily ladder: Tracker channel not configured')
        return
      }

      // Check if event is active
      const isEventActive = await (this.state.config as any).isEventActive()
      if (!isEventActive) {
        console.log('ℹ️ Daily ladder: Event not active, skipping')
        return
      }

      // Get all duos and calculate ladder
      const duos = Array.from(this.state.duos.values())

      if (duos.length === 0) {
        console.log('ℹ️ Daily ladder: No duos to display')
        return
      }

      // Calculate total points for each duo
      const duosWithStats = duos.map((duo) => {
        const noobPlayer = this.state.players.get(duo.noobId)
        const carryPlayer = this.state.players.get(duo.carryId)

        const noobPoints = noobPlayer?.totalPoints || 0
        const carryPoints = carryPlayer?.totalPoints || 0
        const totalPoints = noobPoints + carryPoints

        const wins = duo.wins || 0
        const losses = duo.losses || 0

        return {
          duoName: duo.name || `${noobPlayer?.gameName || 'Unknown'} & ${carryPlayer?.gameName || 'Unknown'}`,
          noobName: noobPlayer?.gameName || 'Unknown',
          carryName: carryPlayer?.gameName || 'Unknown',
          totalPoints,
          wins,
          losses,
        }
      })

      // Sort by total points (descending)
      duosWithStats.sort((a, b) => b.totalPoints - a.totalPoints)

      // Add rank to each duo
      const rankedDuos = duosWithStats.map((duo, index) => ({
        rank: index + 1,
        ...duo,
      }))

      // Create embed with ALL duos (no limit)
      const embed = formatDailyLadder({
        topDuos: rankedDuos,
        date: new Date()
      })

      // Send to tracker channel
      const channel = await this.client.channels.fetch(trackerChannelId)

      if (!channel || !channel.isTextBased()) {
        console.error('❌ Daily ladder: Tracker channel not found or not text-based')
        return
      }

      await channel.send({ embeds: [embed] })
      console.log(`✅ Daily ladder posted (${rankedDuos.length} duos)`)

    } catch (error) {
      console.error('❌ Error posting daily ladder:', error)
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
