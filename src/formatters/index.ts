/**
 * Embed Formatters
 *
 * Central export for all embed formatters
 */

// Base embeds
export {
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  neutralEmbed,
  customEmbed,
  Colors,
  type EmbedField,
  type EmbedData,
} from './base-embeds'

// Setup embeds
export {
  setupChannelsSuccessEmbed,
  setupEventSuccessEmbed,
  setupStatusEmbed,
  setupResetSuccessEmbed,
  setupResetConfirmationEmbed,
  setupChannelsIdenticalErrorEmbed,
  setupEventErrorEmbed,
  setupEventPastDateWarningEmbed,
} from './setup-embeds'

// Game embeds
export {
  gameDetectedEmbed,
  gameEndedEmbed,
  pointsBreakdownEmbed,
  rankChangeEmbed,
  ladderEmbed,
  dailyLadderEmbed,
} from './game-embeds'
