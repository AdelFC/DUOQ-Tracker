/**
 * Discord Router
 *
 * Converts Discord interactions → internal Messages → handlers → Responses → Discord embeds
 */

import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js'
import { Message, MessageType, Response } from '../types/message'
import { State, SystemClock } from '../types/state'
import { ConfigService } from '../services/config/index.js'
import { RiotApiService } from '../services/riot/riot-api.service.js'

// Import handlers
import { registerHandler } from '../handlers/auth/register.handler'
import { linkHandler } from '../handlers/auth/link.handler'
import { unregisterHandler } from '../handlers/auth/unregister.handler'
import { pollGamesHandler } from '../handlers/game/poll.handler'
import { ladderHandler } from '../handlers/stats/ladder.handler'
import { profileHandler } from '../handlers/stats/profile.handler'
import { historyHandler } from '../handlers/stats/history.handler'
import { handleSetupChannels } from '../handlers/admin/setup-channels.handler'
import { handleSetupEvent } from '../handlers/admin/setup-event.handler'
import { handleSetupStatus } from '../handlers/admin/setup-status.handler'
import { handleTestIntegration } from '../handlers/admin/test-integration.handler'
import { handleDevAdd } from '../handlers/dev/dev-add.handler'
import { handleDevRemove } from '../handlers/dev/dev-remove.handler'
import { handleDevList } from '../handlers/dev/dev-list.handler'
import { handleDevStatus } from '../handlers/dev/dev-status.handler'
import { handleDevReset } from '../handlers/dev/dev-reset.handler'
import { handleKeySet } from '../handlers/dev/key-set.handler'
import { handleKeyShow } from '../handlers/dev/key-show.handler'

type CommandName =
  | 'register'
  | 'link'
  | 'unregister'
  | 'poll'
  | 'ladder'
  | 'profile'
  | 'history'
  | 'dev'
  | 'key'
  | 'setup'
  | 'test'

/**
 * Discord Router
 *
 * Handles Discord slash command interactions
 */
class DiscordRouter {
  private state: State

  constructor() {
    // Initialize ConfigService for dynamic challenge configuration
    const configService = new ConfigService()

    // Populate with initial event dates if provided via env
    if (process.env.EVENT_START_DATE) {
      configService.setSync('eventStartDate', process.env.EVENT_START_DATE)
    }
    if (process.env.EVENT_END_DATE) {
      configService.setSync('eventEndDate', process.env.EVENT_END_DATE)
    }
    if (process.env.RIOT_API_KEY) {
      configService.setSync('riotApiKey', process.env.RIOT_API_KEY)
    }

    // Initialize state (in-memory for now, will be hydrated from DB later)
    this.state = {
      players: new Map(),
      duos: new Map(),
      games: new Map(),
      devs: new Map(),
      config: configService,
      clock: new SystemClock(),
      riotService: new RiotApiService(configService),
    }
  }

  /**
   * Get current state (for testing)
   */
  getState(): State {
    return this.state
  }

  /**
   * Set state (for testing)
   */
  setState(state: State): void {
    this.state = state
  }

  /**
   * Handle a slash command interaction
   */
  async handleInteraction(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      // Defer reply to avoid timeout (Discord requires response within 3s)
      await interaction.deferReply()

      // Convert interaction to internal Message
      const message = this.interactionToMessage(interaction)

      // Route to appropriate handler
      const responses: Response[] = []
      await this.routeMessage(message, responses)

      // Format responses as Discord embeds
      if (responses.length === 0) {
        await interaction.editReply({ content: 'Aucune réponse' })
        return
      }

      // Send first response to command sender
      const response = responses[0]!
      const embed = this.responseToEmbed(response, interaction)

      await interaction.editReply({ embeds: [embed] })

      // Send additional responses as follow-ups in the same channel
      for (let i = 1; i < responses.length; i++) {
        const resp = responses[i]!
        const embed = this.responseToEmbed(resp, interaction)

        try {
          await interaction.followUp({
            embeds: [embed],
            ephemeral: resp.ephemeral ?? false
          })
        } catch (error) {
          console.error(`[Router] Failed to send follow-up message:`, error)
        }
      }
    } catch (error) {
      console.error('[Router] Error handling interaction:', error)

      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'

      try {
        await interaction.editReply({
          content: `❌ Erreur: ${errorMessage}`,
        })
      } catch (e) {
        // If we can't edit the reply, try to send a follow-up
        try {
          await interaction.followUp({
            content: `❌ Erreur: ${errorMessage}`,
            ephemeral: true,
          })
        } catch (e2) {
          console.error('[Router] Failed to send error message:', e2)
        }
      }
    }
  }

  /**
   * Route message to appropriate handler
   */
  private async routeMessage(msg: Message, responses: Response[]): Promise<void> {
    switch (msg.type) {
      case MessageType.REGISTER:
        await registerHandler(msg, this.state, responses)
        break

      case MessageType.LINK_ACCOUNT:
        linkHandler(msg, this.state, responses)
        break

      case MessageType.UNREGISTER:
        unregisterHandler(msg, this.state, responses)
        break

      case MessageType.POLL:
        await pollGamesHandler(msg, this.state, responses)
        break

      case MessageType.LADDER:
        ladderHandler(msg, this.state, responses)
        break

      case MessageType.STATS:
        profileHandler(msg, this.state, responses)
        break

      case MessageType.HISTORY:
        historyHandler(msg, this.state, responses)
        break

      case MessageType.SETUP_CHANNELS:
        await handleSetupChannels(msg, this.state, responses)
        break

      case MessageType.SETUP_EVENT:
        await handleSetupEvent(msg, this.state, responses)
        break

      case MessageType.SETUP_STATUS:
        await handleSetupStatus(msg, this.state, responses)
        break

      case MessageType.SETUP_RESET:
        responses.push({
          type: MessageType.ERROR,
          targetId: msg.sourceId,
          content: '❌ Commande /setup reset non implémentée.',
          ephemeral: true,
        })
        break

      case MessageType.TEST_INTEGRATION:
        handleTestIntegration(msg, this.state, responses)
        break

      case MessageType.DEV_ADD:
        handleDevAdd(msg, this.state, responses)
        break

      case MessageType.DEV_REMOVE:
        handleDevRemove(msg, this.state, responses)
        break

      case MessageType.DEV_LIST:
        handleDevList(msg, this.state, responses)
        break

      case MessageType.DEV_STATUS:
        handleDevStatus(msg, this.state, responses)
        break

      case MessageType.DEV_RESET:
        handleDevReset(msg, this.state, responses)
        break

      case MessageType.KEY_SET:
        handleKeySet(msg, this.state, responses)
        break

      case MessageType.KEY_SHOW:
        handleKeyShow(msg, this.state, responses)
        break

      default:
        responses.push({
          type: MessageType.ERROR,
          targetId: msg.sourceId,
          content: `❌ Commande inconnue: ${msg.type}`,
          ephemeral: true,
        })
    }
  }

  /**
   * Convert Discord interaction to internal Message
   */
  private interactionToMessage(interaction: ChatInputCommandInteraction): Message {
    const command = interaction.commandName as CommandName
    const sourceId = interaction.user.id

    // Map command name to MessageType
    let messageType: MessageType
    let payload: any = {}

    switch (command) {
      case 'register': {
        messageType = MessageType.REGISTER
        payload = {
          riotId: interaction.options.getString('riot_id', true),
          mainRole: interaction.options.getString('main_role', true),
          mainChampion: interaction.options.getString('main_champion', true),
          peakElo: interaction.options.getString('peak_elo', true),
        }
        break
      }

      case 'link': {
        messageType = MessageType.LINK_ACCOUNT
        const partner = interaction.options.getUser('partenaire', true)
        const teamName = interaction.options.getString('team_name')

        payload = {
          partnerId: partner.id,
          teamName: teamName || undefined,
        }
        break
      }

      case 'unregister': {
        messageType = MessageType.UNREGISTER
        break
      }

      case 'poll': {
        messageType = MessageType.POLL
        break
      }

      case 'ladder': {
        messageType = MessageType.LADDER
        payload = {
          page: interaction.options.getInteger('page') ?? 1,
        }
        break
      }

      case 'profile': {
        messageType = MessageType.STATS
        const user = interaction.options.getUser('joueur')
        if (user) {
          payload = { targetId: user.id }
        }
        break
      }

      case 'history': {
        messageType = MessageType.HISTORY
        payload = {
          page: interaction.options.getInteger('page') ?? 1,
        }
        break
      }


      case 'setup': {
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand) {
          case 'channels': {
            messageType = MessageType.SETUP_CHANNELS
            const generalChannel = interaction.options.getChannel('general', true)
            const trackerChannel = interaction.options.getChannel('tracker', true)
            const devChannel = interaction.options.getChannel('dev', true)
            payload = {
              generalChannelId: generalChannel.id,
              trackerChannelId: trackerChannel.id,
              devChannelId: devChannel.id,
            }
            break
          }

          case 'event': {
            messageType = MessageType.SETUP_EVENT
            const startDate = interaction.options.getString('start', true)
            const endDate = interaction.options.getString('end', true)
            const timezone = interaction.options.getString('timezone')
            payload = {
              startDate,
              endDate,
              timezone: timezone || 'Europe/Paris',
            }
            break
          }

          case 'status': {
            messageType = MessageType.SETUP_STATUS
            break
          }

          case 'reset': {
            messageType = MessageType.SETUP_RESET
            const confirm = interaction.options.getBoolean('confirm', true)
            payload = {
              confirm,
            }
            break
          }

          default:
            messageType = MessageType.ERROR
            payload = { error: 'Unknown setup subcommand' }
        }
        break
      }

      case 'test': {
        messageType = MessageType.TEST_INTEGRATION
        break
      }

      case 'dev': {
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand) {
          case 'add': {
            messageType = MessageType.DEV_ADD
            const user = interaction.options.getUser('user', true)
            payload = {
              userId: user.id,
            }
            break
          }

          case 'remove': {
            messageType = MessageType.DEV_REMOVE
            const user = interaction.options.getUser('user', true)
            payload = {
              userId: user.id,
            }
            break
          }

          case 'list': {
            messageType = MessageType.DEV_LIST
            break
          }

          case 'status': {
            messageType = MessageType.DEV_STATUS
            break
          }

          case 'reset': {
            messageType = MessageType.DEV_RESET
            break
          }

          default:
            messageType = MessageType.ERROR
            payload = { error: 'Unknown dev subcommand' }
        }
        break
      }

      case 'key': {
        const subcommand = interaction.options.getSubcommand()

        switch (subcommand) {
          case 'set': {
            messageType = MessageType.KEY_SET
            const key = interaction.options.getString('key', true)
            payload = {
              key,
            }
            break
          }

          case 'show': {
            messageType = MessageType.KEY_SHOW
            break
          }

          default:
            messageType = MessageType.ERROR
            payload = { error: 'Unknown key subcommand' }
        }
        break
      }

      default:
        messageType = MessageType.ERROR
        payload = { error: 'Unknown command' }
    }

    return {
      type: messageType,
      sourceId,
      timestamp: new Date(),
      payload,
    }
  }

  /**
   * Convert internal Response to Discord Embed
   */
  private responseToEmbed(response: Response, interaction: ChatInputCommandInteraction): EmbedBuilder {
    // Parse response content (expected to be JSON embed)
    try {
      const embedData = JSON.parse(response.content)

      const embed = new EmbedBuilder()
        .setTitle(embedData.title || null)
        .setDescription(embedData.description || null)
        .setColor(embedData.color || 0x5865f2) // Default Discord blurple

      if (embedData.footer) {
        embed.setFooter({ text: embedData.footer.text })
      }

      if (embedData.fields) {
        embed.addFields(embedData.fields)
      }

      // Handle thumbnail with Discord avatar support
      if (embedData.thumbnail) {
        let thumbnailUrl = embedData.thumbnail.url

        // Convert discord://avatar/{userId} to actual Discord CDN URL
        if (thumbnailUrl.startsWith('discord://avatar/')) {
          const userId = thumbnailUrl.replace('discord://avatar/', '')
          // Get user from Discord client to build avatar URL
          const user = interaction.client.users.cache.get(userId)
          if (user) {
            thumbnailUrl = user.displayAvatarURL({ size: 256 })
          }
        }

        embed.setThumbnail(thumbnailUrl)
      }

      // Handle timestamp
      if (embedData.timestamp) {
        embed.setTimestamp(new Date(embedData.timestamp))
      }

      return embed
    } catch (error) {
      // If parsing fails, treat as plain text
      return new EmbedBuilder()
        .setDescription(response.content)
        .setColor(0x5865f2)
    }
  }
}

// Singleton instance
export const router = new DiscordRouter()
