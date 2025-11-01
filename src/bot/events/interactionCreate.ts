/**
 * Interaction Create Event
 *
 * Handles slash command interactions
 */

import { Client, Events, ChatInputCommandInteraction } from 'discord.js'
import { router } from '../router.js'

export function interactionCreate(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return

    try {
      // Use the router to handle all interactions
      await router.handleInteraction(interaction as ChatInputCommandInteraction)
    } catch (error) {
      console.error(`[Bot] Error executing ${interaction.commandName}:`, error)

      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'

      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({
            content: `❌ Erreur: ${errorMessage}`,
            ephemeral: true,
          })
        } else {
          await interaction.reply({
            content: `❌ Erreur: ${errorMessage}`,
            ephemeral: true,
          })
        }
      } catch (e) {
        console.error('[Bot] Failed to send error message:', e)
      }
    }
  })
}
