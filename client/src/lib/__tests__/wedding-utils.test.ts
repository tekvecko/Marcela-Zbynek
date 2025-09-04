import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  getWeddingCountdown, 
  formatDateForCalendar, 
  createGoogleCalendarUrl,
  type CountdownTime 
} from '../wedding-utils'

describe('Wedding Utils', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  describe('getWeddingCountdown', () => {
    it('calculates correct time until wedding', () => {
      // Set current time to day before wedding
      vi.setSystemTime(new Date('2025-10-10T10:00:00.000Z'))
      
      const countdown = getWeddingCountdown()
      
      expect(countdown.days).toBeGreaterThanOrEqual(0)
      expect(countdown.hours).toBeGreaterThanOrEqual(0)
      expect(countdown.minutes).toBeGreaterThanOrEqual(0)
      expect(countdown.seconds).toBeGreaterThanOrEqual(0)
    })

    it('returns zero for past wedding date', () => {
      // Set current time after wedding
      vi.setSystemTime(new Date('2025-10-12T12:00:00.000Z'))
      
      const countdown = getWeddingCountdown()
      
      expect(countdown.days).toBe(0)
      expect(countdown.hours).toBe(0)
      expect(countdown.minutes).toBe(0)
      expect(countdown.seconds).toBe(0)
    })

    it('returns valid countdown structure', () => {
      vi.setSystemTime(new Date('2025-10-10T12:00:00.000Z'))
      
      const countdown = getWeddingCountdown()
      
      expect(countdown).toHaveProperty('days')
      expect(countdown).toHaveProperty('hours')
      expect(countdown).toHaveProperty('minutes')
      expect(countdown).toHaveProperty('seconds')
      expect(typeof countdown.days).toBe('number')
      expect(typeof countdown.hours).toBe('number')
      expect(typeof countdown.minutes).toBe('number')
      expect(typeof countdown.seconds).toBe('number')
    })
  })

  describe('formatDateForCalendar', () => {
    it('formats date correctly for calendar', () => {
      const testDate = new Date('2025-10-11T14:30:45.123Z')
      const formatted = formatDateForCalendar(testDate)
      
      expect(formatted).toBe('20251011T143045Z')
    })

    it('removes special characters correctly', () => {
      const testDate = new Date('2024-01-01T00:00:00.000Z')
      const formatted = formatDateForCalendar(testDate)
      
      expect(formatted).toBe('20240101T000000Z')
      expect(formatted).not.toContain('-')
      expect(formatted).not.toContain(':')
    })
  })

  describe('createGoogleCalendarUrl', () => {
    it('creates valid Google Calendar URL', () => {
      const url = createGoogleCalendarUrl()
      
      expect(url).toContain('https://calendar.google.com/calendar/render')
      expect(url).toContain('action=TEMPLATE')
      expect(url).toContain('text=Svatba+Marcela+a+Zbyn%C4%9Bk')
      expect(url).toContain('location=Kovalovice+109')
    })

    it('includes correct event details', () => {
      const url = createGoogleCalendarUrl()
      
      expect(url).toContain('details=Svatba')
      expect(url).toContain('dates=')
    })

    it('returns valid URL format', () => {
      const url = createGoogleCalendarUrl()
      
      expect(() => new URL(url)).not.toThrow()
    })
  })
})