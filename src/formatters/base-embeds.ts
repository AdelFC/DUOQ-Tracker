/**
 * Base Embed Formatters
 *
 * Provides reusable embed formatters for common Discord message types
 */

export interface EmbedField {
  name: string
  value: string
  inline?: boolean
}

export interface EmbedData {
  title?: string
  description?: string
  color?: number
  fields?: EmbedField[]
  footer?: { text: string }
  thumbnail?: { url: string }
  image?: { url: string }
  timestamp?: Date
}

/**
 * Discord Color Palette
 */
export const Colors = {
  SUCCESS: 0x00ff00, // Green
  ERROR: 0xff0000, // Red
  WARNING: 0xffa500, // Orange
  INFO: 0x5865f2, // Discord Blurple
  GAME_WIN: 0x00d166, // Bright Green
  GAME_LOSS: 0xff4444, // Bright Red
  NEUTRAL: 0x95a5a6, // Gray
} as const

/**
 * Success Embed (Green)
 *
 * @param title - Embed title
 * @param description - Embed description
 * @param fields - Optional fields
 * @returns Formatted embed data as JSON string
 */
export function successEmbed(
  title: string,
  description: string,
  fields?: EmbedField[]
): string {
  const embed: EmbedData = {
    title: `✅ ${title}`,
    description,
    color: Colors.SUCCESS,
    fields: fields || [],
  }

  return JSON.stringify(embed)
}

/**
 * Error Embed (Red)
 *
 * @param title - Embed title
 * @param description - Error message
 * @param fields - Optional fields
 * @returns Formatted embed data as JSON string
 */
export function errorEmbed(title: string, description: string, fields?: EmbedField[]): string {
  const embed: EmbedData = {
    title: `❌ ${title}`,
    description,
    color: Colors.ERROR,
    fields: fields || [],
  }

  return JSON.stringify(embed)
}

/**
 * Warning Embed (Orange)
 *
 * @param title - Embed title
 * @param description - Warning message
 * @param fields - Optional fields
 * @returns Formatted embed data as JSON string
 */
export function warningEmbed(title: string, description: string, fields?: EmbedField[]): string {
  const embed: EmbedData = {
    title: `⚠️ ${title}`,
    description,
    color: Colors.WARNING,
    fields: fields || [],
  }

  return JSON.stringify(embed)
}

/**
 * Info Embed (Blue)
 *
 * @param title - Embed title
 * @param description - Info message
 * @param fields - Optional fields
 * @param footer - Optional footer text
 * @returns Formatted embed data as JSON string
 */
export function infoEmbed(
  title: string,
  description: string,
  fields?: EmbedField[],
  footer?: string
): string {
  const embed: EmbedData = {
    title: `ℹ️ ${title}`,
    description,
    color: Colors.INFO,
    fields: fields || [],
  }

  if (footer) {
    embed.footer = { text: footer }
  }

  return JSON.stringify(embed)
}

/**
 * Neutral Embed (Gray) - No emoji prefix
 *
 * @param title - Embed title
 * @param description - Embed description
 * @param fields - Optional fields
 * @param footer - Optional footer text
 * @returns Formatted embed data as JSON string
 */
export function neutralEmbed(
  title: string,
  description: string,
  fields?: EmbedField[],
  footer?: string
): string {
  const embed: EmbedData = {
    title,
    description,
    color: Colors.NEUTRAL,
    fields: fields || [],
  }

  if (footer) {
    embed.footer = { text: footer }
  }

  return JSON.stringify(embed)
}

/**
 * Custom Embed - Full control
 *
 * @param data - Full embed data
 * @returns Formatted embed data as JSON string
 */
export function customEmbed(data: EmbedData): string {
  return JSON.stringify(data)
}
