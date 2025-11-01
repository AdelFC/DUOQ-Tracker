/**
 * Types pour les handlers
 * Pattern: (Message, State) → Response[]
 */

import type { Message, Response } from './message.js'
import type { State } from './state.js'

export type Handler = (
  message: Message,
  state: State,
  responses: Response[]
) => Promise<void>

export type HandlerMap = {
  [key: string]: Handler
}
