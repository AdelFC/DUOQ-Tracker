/**
 * Message types pour le système de message-passing
 * Inspiré de /TOMOVE/V2/src/types/message.ts
 */

export enum MessageType {
  // Auth
  REGISTER = 'REGISTER',
  LINK_ACCOUNT = 'LINK_ACCOUNT',
  UNREGISTER = 'UNREGISTER',

  // Tracking
  POLL = 'POLL',
  GAME_DETECTED = 'GAME_DETECTED',
  GAME_SCORED = 'GAME_SCORED',

  // Stats
  LADDER = 'LADDER',
  STATS = 'STATS',
  HISTORY = 'HISTORY',
  DUO_STATS = 'DUO_STATS',

  // Admin
  ADD_POINTS = 'ADD_POINTS',
  REMOVE_POINTS = 'REMOVE_POINTS',
  ADJUST_POINTS = 'ADJUST_POINTS',
  ADMIN_SET_INITIAL_RANK = 'ADMIN_SET_INITIAL_RANK', // TEMP - À SUPPRIMER
  ADMIN_RECALCULATE = 'ADMIN_RECALCULATE', // TEMP - Recalcul scoring v3.0

  // Setup
  SETUP_CHANNELS = 'SETUP_CHANNELS',
  SETUP_EVENT = 'SETUP_EVENT',
  SETUP_STATUS = 'SETUP_STATUS',
  SETUP_RESET = 'SETUP_RESET',

  // Dev
  DEV_ADD = 'DEV_ADD',
  DEV_REMOVE = 'DEV_REMOVE',
  DEV_LIST = 'DEV_LIST',
  DEV_STATUS = 'DEV_STATUS',
  DEV_RESET = 'DEV_RESET',

  // API Key
  KEY_SET = 'KEY_SET',
  KEY_SHOW = 'KEY_SHOW',

  // Testing
  TEST_INTEGRATION = 'TEST_INTEGRATION',

  // System
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  INFO = 'INFO',
}

export interface Message {
  type: MessageType
  sourceId: string // Discord user ID or 'SYSTEM'
  timestamp: Date
  payload?: any
  channelId?: string
}

export interface Response {
  type: MessageType
  targetId: string // Discord user ID or channel ID
  content: string
  embed?: any // Discord embed object
  ephemeral?: boolean // Only visible to user
}
