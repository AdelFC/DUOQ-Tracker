/**
 * Builder pattern for test data
 * Provides fluent API for creating test objects with sensible defaults
 * Adapté de /TOMOVE/V2/src/tests/fixtures/builders.ts
 */

import type { Player, Role, Rank, Division, Lane, RankInfo, MainRole, Streaks } from '../../types/player.js'
import type { Duo } from '../../types/duo.js'
import type { Message, Response } from '../../types/message.js'
import { MessageType } from '../../types/message.js'
import type { PlayerGameStats, GameData, GameStatus } from '../../types/game.js'
import type { State, Config } from '../../types/state.js'
import { FixedClock } from './clock.js'
import { ConfigService } from '../../services/config/index.js'

let playerIdCounter = 0
let duoIdCounter = 0
let messageIdCounter = 0

export function resetBuilderCounters() {
  playerIdCounter = 0
  duoIdCounter = 0
  messageIdCounter = 0
}

/**
 * PlayerBuilder - Fluent API for creating test players
 */
export class PlayerBuilder {
  private player: Partial<Player> = {}
  private clock = new FixedClock()

  withId(discordId: string): this {
    this.player.discordId = discordId
    return this
  }

  withDiscordId(discordId: string): this {
    this.player.discordId = discordId
    return this
  }

  withPuuid(puuid: string): this {
    this.player.puuid = puuid
    return this
  }

  withGameName(gameName: string, tagLine: string = 'EUW'): this {
    this.player.gameName = gameName
    this.player.tagLine = tagLine
    return this
  }

  withRole(role: Role): this {
    this.player.role = role
    return this
  }

  asNoob(): this {
    this.player.role = 'noob'
    return this
  }

  asCarry(): this {
    this.player.role = 'carry'
    return this
  }

  withDuo(duoId: number): this {
    this.player.duoId = duoId
    return this
  }

  withRank(tier: Rank, division: Division | null = null, lp: number = 0): this {
    this.player.currentRank = { tier, division, lp }
    return this
  }

  withDetectedMainRole(lane: Lane, championId: number, championName: string): this {
    ;(this.player as any).detectedMainRole = { lane, championId, championName }
    return this
  }

  withPeakElo(peakElo: string): this {
    (this.player as any).peakElo = peakElo
    return this
  }

  withInitialRank(initialRank: string): this {
    (this.player as any).initialRank = initialRank
    return this
  }

  withMainRoleString(mainRoleString: string): this {
    (this.player as any).mainRoleString = mainRoleString
    return this
  }

  withMainChampion(mainChampion: string): this {
    (this.player as any).mainChampion = mainChampion
    return this
  }

  withPoints(points: number): this {
    this.player.totalPoints = points
    return this
  }

  withGames(played: number, wins: number, losses: number): this {
    this.player.gamesPlayed = played
    this.player.wins = wins
    this.player.losses = losses
    return this
  }

  withStreaks(current: number, longestWin: number = 0, longestLoss: number = 0): this {
    this.player.streaks = { current, longestWin, longestLoss }
    return this
  }

  withClock(clock: FixedClock): this {
    this.clock = clock
    return this
  }

  build(): Player {
    const discordId = this.player.discordId || `test_player_${++playerIdCounter}`
    const gameName = this.player.gameName || `Player${playerIdCounter}`

    return {
      discordId,
      puuid: this.player.puuid || `puuid_${discordId}`,
      gameName,
      tagLine: this.player.tagLine || 'EUW',
      role: this.player.role || 'noob',
      duoId: this.player.duoId ?? 0,
      peakElo: (this.player as any).peakElo || 'G4',
      initialRank: (this.player as any).initialRank || 'G4',
      currentRank: this.player.currentRank || { tier: 'GOLD', division: 'IV', lp: 0 },
      mainRoleString: (this.player as any).mainRoleString || 'MID',
      mainChampion: (this.player as any).mainChampion || 'Yasuo',
      detectedMainRole: (this.player as any).detectedMainRole || null,
      totalPoints: this.player.totalPoints ?? 0,
      gamesPlayed: this.player.gamesPlayed ?? 0,
      wins: this.player.wins ?? 0,
      losses: this.player.losses ?? 0,
      streaks: this.player.streaks || { current: 0, longestWin: 0, longestLoss: 0 },
      registeredAt: this.player.registeredAt || this.clock.now(),
      lastGameAt: this.player.lastGameAt || null,
    }
  }
}

/**
 * DuoBuilder - Fluent API for creating test duos
 */
export class DuoBuilder {
  private duo: Partial<Duo> = {}
  private clock = new FixedClock()

  withId(id: number): this {
    this.duo.id = id
    return this
  }

  withName(name: string): this {
    this.duo.name = name
    return this
  }

  withPlayers(noobId: string, carryId: string): this {
    this.duo.noobId = noobId
    this.duo.carryId = carryId
    return this
  }

  withNoob(noobId: string): this {
    this.duo.noobId = noobId
    return this
  }

  withCarry(carryId: string): this {
    this.duo.carryId = carryId
    return this
  }

  withPoints(points: number): this {
    this.duo.totalPoints = points
    return this
  }

  withGames(played: number, wins: number, losses: number): this {
    this.duo.gamesPlayed = played
    this.duo.wins = wins
    this.duo.losses = losses
    return this
  }

  withStreak(current: number, longestWin: number = 0, longestLoss: number = 0): this {
    this.duo.currentStreak = current
    this.duo.longestWinStreak = longestWin
    this.duo.longestLossStreak = longestLoss
    return this
  }

  withClock(clock: FixedClock): this {
    this.clock = clock
    return this
  }

  build(): Duo {
    const id = this.duo.id ?? ++duoIdCounter

    if (!this.duo.noobId || !this.duo.carryId) {
      throw new Error('DuoBuilder: noobId and carryId are required')
    }

    return {
      id,
      name: this.duo.name || `Duo ${id}`,
      noobId: this.duo.noobId,
      carryId: this.duo.carryId,
      totalPoints: this.duo.totalPoints ?? 0,
      gamesPlayed: this.duo.gamesPlayed ?? 0,
      wins: this.duo.wins ?? 0,
      losses: this.duo.losses ?? 0,
      currentStreak: this.duo.currentStreak ?? 0,
      longestWinStreak: this.duo.longestWinStreak ?? 0,
      longestLossStreak: this.duo.longestLossStreak ?? 0,
      createdAt: this.duo.createdAt || this.clock.now(),
      lastGameAt: this.duo.lastGameAt || null,
    }
  }
}

/**
 * PlayerGameStatsBuilder - Fluent API for creating test game stats
 */
export class PlayerGameStatsBuilder {
  private stats: Partial<PlayerGameStats> = {}

  withPuuid(puuid: string): this {
    this.stats.puuid = puuid
    return this
  }

  withKDA(kills: number, deaths: number, assists: number): this {
    this.stats.kills = kills
    this.stats.deaths = deaths
    this.stats.assists = assists
    return this
  }

  withChampion(championId: number, championName: string): this {
    this.stats.championId = championId
    this.stats.championName = championName
    return this
  }

  withLane(lane: Lane): this {
    this.stats.lane = lane
    return this
  }

  withTeamId(teamId: number): this {
    (this.stats as any).teamId = teamId
    return this
  }

  withRankChange(previous: RankInfo, newRank: RankInfo): this {
    this.stats.previousRank = previous
    this.stats.newRank = newRank
    return this
  }

  offRole(): this {
    this.stats.isOffRole = true
    return this
  }

  offChampion(): this {
    this.stats.isOffChampion = true
    return this
  }

  build(): PlayerGameStats {
    if (!this.stats.puuid) {
      throw new Error('PlayerGameStatsBuilder: puuid is required')
    }

    return {
      puuid: this.stats.puuid,
      summonerId: this.stats.summonerId || `summoner_${this.stats.puuid}`,
      championId: this.stats.championId || 1,
      championName: this.stats.championName || 'Annie',
      lane: this.stats.lane || 'MIDDLE',
      teamId: (this.stats as any).teamId || 100,
      kills: this.stats.kills ?? 0,
      deaths: this.stats.deaths ?? 0,
      assists: this.stats.assists ?? 0,
      previousRank: this.stats.previousRank || { tier: 'GOLD', division: 'IV', lp: 50 },
      newRank: this.stats.newRank || { tier: 'GOLD', division: 'IV', lp: 70 },
      isOffRole: this.stats.isOffRole ?? false,
      isOffChampion: this.stats.isOffChampion ?? false,
    }
  }
}

/**
 * GameDataBuilder - Fluent API for creating test game data
 */
export class GameDataBuilder {
  private game: Partial<GameData> = {}
  private clock = new FixedClock()

  withMatchId(matchId: string): this {
    this.game.matchId = matchId
    return this
  }

  withDuo(duoId: number): this {
    this.game.duoId = duoId
    return this
  }

  withDuration(seconds: number): this {
    this.game.duration = seconds
    return this
  }

  withResult(win: boolean): this {
    this.game.win = win
    return this
  }

  asVictory(): this {
    this.game.win = true
    return this
  }

  asDefeat(): this {
    this.game.win = false
    return this
  }

  asRemake(): this {
    this.game.remake = true
    this.game.win = false // Remakes are always false in win field
    return this
  }

  asSurrender(): this {
    this.game.surrender = true
    this.game.win = false // Surrenders are always defeats
    return this
  }

  withNoobStats(stats: PlayerGameStats): this {
    this.game.noobStats = stats
    return this
  }

  withCarryStats(stats: PlayerGameStats): this {
    this.game.carryStats = stats
    return this
  }

  withStatus(status: GameStatus): this {
    this.game.status = status
    return this
  }

  withClock(clock: FixedClock): this {
    this.clock = clock
    return this
  }

  build(): GameData {
    if (!this.game.noobStats || !this.game.carryStats) {
      throw new Error('GameDataBuilder: noobStats and carryStats are required')
    }

    const now = this.clock.now()

    return {
      matchId: this.game.matchId || `EUW1_${Date.now()}`,
      gameId: this.game.gameId || Date.now(),
      startTime: this.game.startTime || new Date(now.getTime() - 1800000), // 30 min ago
      endTime: this.game.endTime || now,
      duration: this.game.duration ?? 1800,
      duoId: this.game.duoId || 1,
      noobStats: this.game.noobStats,
      carryStats: this.game.carryStats,
      win: this.game.win ?? true,
      remake: this.game.remake ?? false,
      surrender: this.game.surrender ?? false,
      status: this.game.status || 'COMPLETED',
      detectedAt: this.game.detectedAt || now,
      scoredAt: this.game.scoredAt || null,
    }
  }
}

/**
 * MessageBuilder - Fluent API for creating test messages
 */
export class MessageBuilder {
  private message: Partial<Message> = {}
  private clock = new FixedClock()

  withType(type: MessageType): this {
    this.message.type = type
    return this
  }

  withPayload(payload: any): this {
    this.message.payload = payload
    return this
  }

  fromSource(sourceId: string): this {
    this.message.sourceId = sourceId
    return this
  }

  withChannelId(channelId: string): this {
    this.message.channelId = channelId
    return this
  }

  withClock(clock: FixedClock): this {
    this.clock = clock
    return this
  }

  build(): Message {
    return {
      type: this.message.type || MessageType.INFO,
      sourceId: this.message.sourceId || 'SYSTEM',
      timestamp: this.message.timestamp || this.clock.now(),
      payload: this.message.payload,
      channelId: this.message.channelId,
    }
  }
}

/**
 * StateBuilder - Fluent API for creating test state
 */
export class StateBuilder {
  private state: State
  private clock = new FixedClock()

  constructor() {
    const configService = new ConfigService()
    this.state = {
      players: new Map(),
      duos: new Map(),
      games: new Map(),
      devs: new Map(),
      config: configService,
      clock: this.clock,
    }
  }

  withPlayers(players: Player[]): this {
    players.forEach((player) => this.state.players.set(player.discordId, player))
    return this
  }

  withDuos(duos: Duo[]): this {
    duos.forEach((duo) => this.state.duos.set(duo.id, duo))
    return this
  }

  withConfig(config: Partial<Config>): this {
    // For backward compatibility: if old Config is passed, keep it
    // Otherwise we use ConfigService
    if (this.state.config instanceof ConfigService) {
      // Can't merge old Config with ConfigService, so we ignore this
      // Tests should use ConfigService methods directly
    } else {
      this.state.config = { ...this.state.config, ...config }
    }
    return this
  }

  withClock(clock: FixedClock): this {
    this.clock = clock
    this.state.clock = clock
    return this
  }

  build(): State {
    return this.state
  }
}

// Convenience functions (shortcuts for common cases)

export function player(id?: string): PlayerBuilder {
  const builder = new PlayerBuilder()
  return id ? builder.withId(id) : builder
}

export function duo(noobId?: string, carryId?: string): DuoBuilder {
  const builder = new DuoBuilder()
  if (noobId && carryId) {
    builder.withPlayers(noobId, carryId)
  }
  return builder
}

export function playerStats(puuid: string): PlayerGameStatsBuilder {
  return new PlayerGameStatsBuilder().withPuuid(puuid)
}

export function gameData(): GameDataBuilder {
  return new GameDataBuilder()
}

export function message(type?: MessageType, payload?: any, sourceId?: string): MessageBuilder {
  const builder = new MessageBuilder()
  if (type) builder.withType(type)
  if (payload) builder.withPayload(payload)
  if (sourceId) builder.fromSource(sourceId)
  return builder
}

export function state(): StateBuilder {
  return new StateBuilder()
}
