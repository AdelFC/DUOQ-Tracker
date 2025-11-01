/**
 * Tests for base-embeds.ts
 */

import { describe, it, expect } from 'vitest'
import {
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  neutralEmbed,
  customEmbed,
  Colors,
} from '../../formatters/base-embeds'

describe('Base Embeds', () => {
  describe('successEmbed', () => {
    it('should create a success embed with green color', () => {
      const result = successEmbed('Test Success', 'This is a success message')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('✅ Test Success')
      expect(parsed.description).toBe('This is a success message')
      expect(parsed.color).toBe(Colors.SUCCESS)
      expect(parsed.fields).toEqual([])
    })

    it('should include fields when provided', () => {
      const fields = [
        { name: 'Field 1', value: 'Value 1', inline: true },
        { name: 'Field 2', value: 'Value 2', inline: false },
      ]
      const result = successEmbed('Success', 'Message', fields)
      const parsed = JSON.parse(result)

      expect(parsed.fields).toEqual(fields)
    })
  })

  describe('errorEmbed', () => {
    it('should create an error embed with red color', () => {
      const result = errorEmbed('Test Error', 'This is an error message')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('❌ Test Error')
      expect(parsed.description).toBe('This is an error message')
      expect(parsed.color).toBe(Colors.ERROR)
    })
  })

  describe('warningEmbed', () => {
    it('should create a warning embed with orange color', () => {
      const result = warningEmbed('Test Warning', 'This is a warning message')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('⚠️ Test Warning')
      expect(parsed.description).toBe('This is a warning message')
      expect(parsed.color).toBe(Colors.WARNING)
    })
  })

  describe('infoEmbed', () => {
    it('should create an info embed with blue color', () => {
      const result = infoEmbed('Test Info', 'This is an info message')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('ℹ️ Test Info')
      expect(parsed.description).toBe('This is an info message')
      expect(parsed.color).toBe(Colors.INFO)
    })

    it('should include footer when provided', () => {
      const result = infoEmbed('Info', 'Message', [], 'Footer text')
      const parsed = JSON.parse(result)

      expect(parsed.footer).toEqual({ text: 'Footer text' })
    })

    it('should not include footer when not provided', () => {
      const result = infoEmbed('Info', 'Message')
      const parsed = JSON.parse(result)

      expect(parsed.footer).toBeUndefined()
    })
  })

  describe('neutralEmbed', () => {
    it('should create a neutral embed with gray color', () => {
      const result = neutralEmbed('Test Neutral', 'This is a neutral message')
      const parsed = JSON.parse(result)

      expect(parsed.title).toBe('Test Neutral') // No emoji prefix
      expect(parsed.description).toBe('This is a neutral message')
      expect(parsed.color).toBe(Colors.NEUTRAL)
    })

    it('should include footer when provided', () => {
      const result = neutralEmbed('Neutral', 'Message', [], 'Footer')
      const parsed = JSON.parse(result)

      expect(parsed.footer).toEqual({ text: 'Footer' })
    })
  })

  describe('customEmbed', () => {
    it('should create a custom embed with all properties', () => {
      const customData = {
        title: 'Custom Title',
        description: 'Custom Description',
        color: 0x123456,
        fields: [{ name: 'Custom', value: 'Field', inline: true }],
        footer: { text: 'Custom Footer' },
        thumbnail: { url: 'https://example.com/thumb.png' },
        image: { url: 'https://example.com/image.png' },
        timestamp: new Date('2025-01-01'),
      }

      const result = customEmbed(customData)
      const parsed = JSON.parse(result)

      // Note: JSON.stringify converts Date to ISO string
      expect(parsed.title).toBe(customData.title)
      expect(parsed.description).toBe(customData.description)
      expect(parsed.color).toBe(customData.color)
      expect(parsed.fields).toEqual(customData.fields)
      expect(parsed.footer).toEqual(customData.footer)
      expect(parsed.thumbnail).toEqual(customData.thumbnail)
      expect(parsed.image).toEqual(customData.image)
      expect(parsed.timestamp).toBe('2025-01-01T00:00:00.000Z') // Serialized as string
    })
  })

  describe('Colors', () => {
    it('should have correct color values', () => {
      expect(Colors.SUCCESS).toBe(0x00ff00)
      expect(Colors.ERROR).toBe(0xff0000)
      expect(Colors.WARNING).toBe(0xffa500)
      expect(Colors.INFO).toBe(0x5865f2)
      expect(Colors.GAME_WIN).toBe(0x00d166)
      expect(Colors.GAME_LOSS).toBe(0xff4444)
      expect(Colors.NEUTRAL).toBe(0x95a5a6)
    })
  })

  describe('JSON output', () => {
    it('should produce valid JSON for all embed types', () => {
      const embeds = [
        successEmbed('Success', 'Test'),
        errorEmbed('Error', 'Test'),
        warningEmbed('Warning', 'Test'),
        infoEmbed('Info', 'Test'),
        neutralEmbed('Neutral', 'Test'),
      ]

      embeds.forEach((embed) => {
        expect(() => JSON.parse(embed)).not.toThrow()
      })
    })
  })
})
