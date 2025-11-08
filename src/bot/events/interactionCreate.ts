/**
 * Interaction Create Event
 *
 * Handles slash command interactions and autocomplete
 */

import { Client, Events, ChatInputCommandInteraction, AutocompleteInteraction } from 'discord.js'
import { router } from '../router.js'

export function interactionCreate(client: Client): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    // Handle autocomplete interactions
    if (interaction.isAutocomplete()) {
      try {
        await handleAutocomplete(interaction as AutocompleteInteraction)
      } catch (error) {
        console.error('[Bot] Error handling autocomplete:', error)
      }
      return
    }

    // Handle chat input command interactions
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

/**
 * Handle autocomplete interactions
 */
async function handleAutocomplete(interaction: AutocompleteInteraction): Promise<void> {
  const commandName = interaction.commandName
  const focusedOption = interaction.options.getFocused(true)

  // Handle /add-points autocomplete
  if (commandName === 'add-points' && focusedOption.name === 'team_name') {
    const state = router.getState()
    const focusedValue = focusedOption.value.toLowerCase()

    // Get all duo team names
    const duos = Array.from(state.duos.values())

    // Filter duos based on user input (case-insensitive)
    const filtered = duos
      .filter((duo) => duo.name.toLowerCase().includes(focusedValue))
      .slice(0, 25) // Discord limits to 25 choices

    // Map to autocomplete choices
    const choices = filtered.map((duo) => ({
      name: `${duo.name} (${duo.totalPoints} pts)`,
      value: duo.name,
    }))

    await interaction.respond(choices)
  }
}
