import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges classNames correctly', () => {
      const result = cn('px-2 py-1', 'bg-blue-500', 'text-white')
      expect(result).toBe('px-2 py-1 bg-blue-500 text-white')
    })

    it('handles conditional classNames', () => {
      const isActive = true
      const result = cn('base-class', isActive && 'active-class')
      expect(result).toBe('base-class active-class')
    })

    it('handles conflicting classNames with tailwind-merge', () => {
      const result = cn('px-2 px-4', 'py-1 py-2')
      // tailwind-merge should resolve conflicts, keeping the last value
      expect(result).toContain('px-4')
      expect(result).toContain('py-2')
    })

    it('filters out falsy values', () => {
      const result = cn('class1', false, null, undefined, '', 'class2')
      expect(result).toBe('class1 class2')
    })

    it('works with arrays', () => {
      const result = cn(['class1', 'class2'], 'class3')
      expect(result).toBe('class1 class2 class3')
    })
  })
})