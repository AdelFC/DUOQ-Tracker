/**
 * Ready Event
 *
 * Fired when the Discord bot is ready
 */

import { Client, Events } from 'discord.js'

export function ready(client: Client): void {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`[Bot] Ready! Logged in as ${readyClient.user?.tag}`)
  })
}
