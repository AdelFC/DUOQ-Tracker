/**
 * Persistence Service
 *
 * Handles saving and loading bot state to/from JSON file
 * - Auto-save every 5 minutes
 * - Save on bot shutdown
 * - Load on bot startup
 *
 * Prevents data loss on restarts/crashes
 */

import fs from 'fs'
import path from 'path'
import type { State, Dev } from '../types/state.js'
import type { Player } from '../types/player.js'
import type { Duo } from '../types/duo.js'
import type { TrackedGame } from '../types/game.js'

interface PersistedState {
  version: string
  savedAt: string
  players: Player[]
  duos: Duo[]
  games: TrackedGame[]
  devs: Dev[]
  config: Record<string, any>
}

export class PersistenceService {
  private intervalId: NodeJS.Timeout | null = null
  private readonly filePath: string
  private readonly backupPath: string
  private isSaving = false

  constructor(
    private state: State,
    dataDir: string = './data',
    fileName: string = 'state.json'
  ) {
    // Ensure data directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    this.filePath = path.join(dataDir, fileName)
    this.backupPath = path.join(dataDir, `${fileName}.backup`)
  }

  /**
   * Start auto-save interval (every 5 minutes)
   */
  start(intervalMs: number = 5 * 60 * 1000): void {
    if (this.intervalId) {
      console.log('[Persistence] Already running')
      return
    }

    console.log(`[Persistence] Started (auto-save every ${intervalMs / 1000}s)`)

    // Save at regular intervals
    this.intervalId = setInterval(() => {
      this.save()
    }, intervalMs)
  }

  /**
   * Stop auto-save interval
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('[Persistence] Stopped')
    }
  }

  /**
   * Check if service is running
   */
  isRunning(): boolean {
    return this.intervalId !== null
  }

  /**
   * Save current state to JSON file
   */
  async save(): Promise<void> {
    // Prevent concurrent saves
    if (this.isSaving) {
      console.warn('[Persistence] Save already in progress, skipping')
      return
    }

    this.isSaving = true

    try {
      // Serialize state
      const serialized = this.serializeState()

      // Create backup of current file (if exists)
      if (fs.existsSync(this.filePath)) {
        fs.copyFileSync(this.filePath, this.backupPath)
      }

      // Write to file (atomic write via temp file)
      const tempPath = `${this.filePath}.tmp`
      fs.writeFileSync(tempPath, JSON.stringify(serialized, null, 2), 'utf-8')

      // Rename temp file to actual file (atomic operation)
      fs.renameSync(tempPath, this.filePath)

      const stats = this.getStats()
      console.log(
        `[Persistence] Saved - ${stats.players} players, ${stats.duos} duos, ${stats.games} games`
      )
    } catch (error) {
      console.error('[Persistence] Error saving state:', error)
    } finally {
      this.isSaving = false
    }
  }

  /**
   * Load state from JSON file
   */
  async load(): Promise<boolean> {
    try {
      // Check if file exists
      if (!fs.existsSync(this.filePath)) {
        console.log('[Persistence] No saved state found, starting fresh')
        return false
      }

      // Read file
      const content = fs.readFileSync(this.filePath, 'utf-8')
      const data: PersistedState = JSON.parse(content)

      // Validate version (future-proofing)
      if (!data.version) {
        console.warn('[Persistence] No version in saved state, might be incompatible')
      }

      // Deserialize and restore state
      this.deserializeState(data)

      const savedAt = new Date(data.savedAt)
      const stats = this.getStats()
      console.log(
        `[Persistence] Loaded - ${stats.players} players, ${stats.duos} duos, ${stats.games} games (saved ${this.formatTimeSince(savedAt)})`
      )

      return true
    } catch (error) {
      console.error('[Persistence] Error loading state:', error)

      // Try loading from backup
      if (fs.existsSync(this.backupPath)) {
        console.log('[Persistence] Attempting to load from backup...')
        try {
          const content = fs.readFileSync(this.backupPath, 'utf-8')
          const data: PersistedState = JSON.parse(content)
          this.deserializeState(data)
          console.log('[Persistence] Successfully loaded from backup')
          return true
        } catch (backupError) {
          console.error('[Persistence] Backup also failed:', backupError)
        }
      }

      return false
    }
  }

  /**
   * Serialize state to JSON-compatible object
   */
  private serializeState(): PersistedState {
    // Convert Maps to Arrays
    const players = Array.from(this.state.players.values())
    const duos = Array.from(this.state.duos.values())
    const games = Array.from(this.state.games.values())
    const devs = Array.from(this.state.devs.values())

    // Extract config (only persistent values)
    const config: Record<string, any> = {}
    if (this.state.config && 'getAll' in this.state.config) {
      const allConfig = (this.state.config as any).getAll()
      config.generalChannelId = allConfig.generalChannelId
      config.trackerChannelId = allConfig.trackerChannelId
      config.devChannelId = allConfig.devChannelId
      config.eventStartDate = allConfig.eventStartDate
      config.eventEndDate = allConfig.eventEndDate
      config.riotApiKey = allConfig.riotApiKey
      config.riotApiKeyUpdatedAt = allConfig.riotApiKeyUpdatedAt
      config.riotApiKeyReminders = allConfig.riotApiKeyReminders
      config.challengeEndReminders = allConfig.challengeEndReminders
    }

    return {
      version: '1.0.0',
      savedAt: new Date().toISOString(),
      players,
      duos,
      games,
      devs,
      config,
    }
  }

  /**
   * Deserialize JSON data back to state
   */
  private deserializeState(data: PersistedState): void {
    // Clear existing state
    this.state.players.clear()
    this.state.duos.clear()
    this.state.games.clear()
    this.state.devs.clear()

    // Restore players
    for (const player of data.players) {
      // Convert date strings back to Date objects
      const restoredPlayer: Player = {
        ...player,
        registeredAt: new Date(player.registeredAt),
        lastGameAt: player.lastGameAt ? new Date(player.lastGameAt) : null,
      }
      this.state.players.set(player.discordId, restoredPlayer)
    }

    // Restore duos
    for (const duo of data.duos) {
      const restoredDuo: Duo = {
        ...duo,
        createdAt: new Date(duo.createdAt),
        lastGameAt: duo.lastGameAt ? new Date(duo.lastGameAt) : null,
      }
      this.state.duos.set(duo.id, restoredDuo)
    }

    // Restore games
    for (const game of data.games) {
      const restoredGame: TrackedGame = {
        ...game,
        startTime: new Date(game.startTime),
        endTime: new Date(game.endTime),
        createdAt: new Date(game.createdAt),
      }
      this.state.games.set(game.id, restoredGame)
    }

    // Restore devs
    for (const dev of data.devs) {
      this.state.devs.set(dev.userId, dev)
    }

    // Restore config
    if (this.state.config && 'setSync' in this.state.config) {
      for (const [key, value] of Object.entries(data.config)) {
        if (value !== undefined && value !== null) {
          ;(this.state.config as any).setSync(key, value)
        }
      }
    }
  }

  /**
   * Get current state statistics
   */
  private getStats() {
    return {
      players: this.state.players.size,
      duos: this.state.duos.size,
      games: this.state.games.size,
      devs: this.state.devs.size,
    }
  }

  /**
   * Format time since a date (e.g., "2 minutes ago")
   */
  private formatTimeSince(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  /**
   * Manually trigger a save (useful before shutdown)
   */
  async forceSave(): Promise<void> {
    console.log('[Persistence] Force save requested')
    await this.save()
  }

  /**
   * Get file path (for debugging)
   */
  getFilePath(): string {
    return this.filePath
  }

  /**
   * Check if saved state exists
   */
  hasSavedState(): boolean {
    return fs.existsSync(this.filePath)
  }
}
