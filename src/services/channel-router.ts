/**
 * Channel Router Service
 * Route les messages vers le bon channel Discord selon le type de message
 *
 * Règles de routage:
 * - User commands (REGISTER, LINK_ACCOUNT, STATS, etc.) → General Channel
 * - Game notifications (GAME_DETECTED, GAME_ENDED, GAME_SCORED) → Tracker Channel
 * - Ladder → Tracker Channel
 * - Setup commands → Source (ephemeral) ou General
 */

import type { Response } from '../types/message.js'
import { MessageType } from '../types/message.js'
import type { ConfigService } from './config/index.js'

export interface RoutedResponse extends Response {
  channel: 'general' | 'tracker' | 'source' | 'both'
}

export class ChannelRouter {
  constructor(private config: ConfigService) {}

  /**
   * Route une response vers le bon channel
   */
  async route(response: Response): Promise<RoutedResponse> {
    const channel = this.getChannelForMessageType(response.type, response.ephemeral)

    return {
      ...response,
      channel,
    }
  }

  /**
   * Route plusieurs responses
   */
  async routeMany(responses: Response[]): Promise<RoutedResponse[]> {
    return Promise.all(responses.map((r) => this.route(r)))
  }

  /**
   * Détermine le channel selon le type de message
   */
  private getChannelForMessageType(
    type: MessageType,
    ephemeral?: boolean
  ): 'general' | 'tracker' | 'source' | 'both' {
    // Les messages ephemeral vont toujours à la source (user)
    if (ephemeral) {
      return 'source'
    }

    // Notifications de game → Tracker Channel
    if (
      type === MessageType.GAME_DETECTED ||
      type === MessageType.GAME_ENDED ||
      type === MessageType.GAME_SCORED
    ) {
      return 'tracker'
    }

    // Ladder → Tracker Channel
    if (type === MessageType.LADDER) {
      return 'tracker'
    }

    // User commands → General Channel
    if (
      type === MessageType.REGISTER ||
      type === MessageType.UNREGISTER ||
      type === MessageType.LINK_ACCOUNT ||
      type === MessageType.STATS ||
      type === MessageType.HISTORY ||
      type === MessageType.DUO_STATS
    ) {
      return 'general'
    }

    // Setup commands → Source (targetId already set correctly)
    if (
      type === MessageType.SETUP_CHANNELS ||
      type === MessageType.SETUP_EVENT ||
      type === MessageType.SETUP_STATUS ||
      type === MessageType.SETUP_RESET ||
      type === MessageType.TEST_INTEGRATION
    ) {
      return 'source'
    }

    // Admin commands → General Channel
    if (
      type === MessageType.ADD_POINTS ||
      type === MessageType.REMOVE_POINTS ||
      type === MessageType.ADJUST_POINTS
    ) {
      return 'general'
    }

    // System messages (ERROR, SUCCESS, INFO) → Source
    if (
      type === MessageType.ERROR ||
      type === MessageType.SUCCESS ||
      type === MessageType.INFO
    ) {
      return 'source'
    }

    // Default: source
    return 'source'
  }

  /**
   * Obtient l'ID du channel configuré
   */
  async getChannelId(channel: 'general' | 'tracker' | 'source', sourceId?: string): Promise<string | null> {
    if (channel === 'source') {
      return sourceId || null
    }

    if (channel === 'general') {
      return await this.config.get('generalChannelId')
    }

    if (channel === 'tracker') {
      return await this.config.get('trackerChannelId')
    }

    return null
  }

  /**
   * Applique le routage à une response (modifie targetId)
   */
  async applyRouting(response: Response): Promise<Response> {
    const routed = await this.route(response)

    // Si le channel est 'source', on garde le targetId original
    if (routed.channel === 'source') {
      return response
    }

    // Sinon, on remplace le targetId par le channel ID configuré
    const channelId = await this.getChannelId(routed.channel, response.targetId)

    if (!channelId) {
      // Si le channel n'est pas configuré, on garde le targetId original
      // et on log un warning (dans une vraie app)
      return response
    }

    return {
      ...response,
      targetId: channelId,
    }
  }

  /**
   * Applique le routage à plusieurs responses
   */
  async applyRoutingMany(responses: Response[]): Promise<Response[]> {
    return Promise.all(responses.map((r) => this.applyRouting(r)))
  }

  /**
   * Broadcast un message aux deux channels (general + tracker)
   */
  async broadcast(response: Omit<Response, 'targetId'>): Promise<Response[]> {
    const generalId = await this.config.get('generalChannelId')
    const trackerId = await this.config.get('trackerChannelId')

    const responses: Response[] = []

    if (generalId) {
      responses.push({
        ...response,
        targetId: generalId,
      })
    }

    if (trackerId) {
      responses.push({
        ...response,
        targetId: trackerId,
      })
    }

    return responses
  }
}