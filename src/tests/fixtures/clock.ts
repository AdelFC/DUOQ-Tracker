/**
 * Clock fixtures pour tests déterministes
 * Adapté de /TOMOVE/V2/src/tests/fixtures/clock.ts
 */

import type { Clock } from '../../types/state.js'

/**
 * Fixed clock for tests - time doesn't pass unless explicitly advanced
 */
export class FixedClock implements Clock {
  private currentTime: Date

  constructor(fixedTime: Date | string = '2025-11-15T20:00:00Z') {
    this.currentTime = typeof fixedTime === 'string' ? new Date(fixedTime) : fixedTime
  }

  now(): Date {
    return new Date(this.currentTime)
  }

  // Test utilities
  setTime(time: Date | string): void {
    this.currentTime = typeof time === 'string' ? new Date(time) : time
  }

  advanceMilliseconds(ms: number): void {
    this.currentTime = new Date(this.currentTime.getTime() + ms)
  }

  advanceSeconds(seconds: number): void {
    this.advanceMilliseconds(seconds * 1000)
  }

  advanceMinutes(minutes: number): void {
    this.advanceMilliseconds(minutes * 60 * 1000)
  }

  advanceHours(hours: number): void {
    this.advanceMilliseconds(hours * 60 * 60 * 1000)
  }

  advanceDays(days: number): void {
    this.advanceMilliseconds(days * 24 * 60 * 60 * 1000)
  }

  reset(): void {
    this.currentTime = new Date('2025-11-15T20:00:00Z')
  }
}

/**
 * Helper to check if two dates are the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
