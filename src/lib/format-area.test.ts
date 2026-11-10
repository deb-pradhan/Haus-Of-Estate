import { describe, expect, it } from 'vitest'
import {
  formatAreaRangeWithMetric,
  formatAreaWithMetric,
  formatSquareFeet,
  formatSquareFeetRange,
  formatSquareMetresFromSquareFeet,
} from './format-area'

describe('area figures', () => {
  it('keeps the square-foot source figure and adds a whole square-metre conversion', () => {
    expect(formatSquareFeet(4500)).toBe('4,500 sq ft')
    expect(formatSquareMetresFromSquareFeet(4500)).toBe('418 sq m')
    expect(formatAreaWithMetric(4500)).toBe('4,500 sq ft (418 sq m)')
    // 889.9 sq ft is the supplied London figure; its own listing states 82.67 m².
    expect(formatAreaWithMetric(889.9, 1)).toBe('889.9 sq ft (83 sq m)')
  })

  it('rounds to whole numbers unless a source figure’s decimals are asked for', () => {
    expect(formatSquareFeet(4500.25)).toBe('4,500 sq ft')
    expect(formatSquareFeet(4500.25, 2)).toBe('4,500.25 sq ft')
  })

  it('formats ranges once, without repeating the unit or a matching figure', () => {
    expect(formatSquareFeetRange(3100, 4500)).toBe('3,100–4,500 sq ft')
    expect(formatSquareFeetRange(3100, 3100)).toBe('3,100 sq ft')
    expect(formatAreaRangeWithMetric(3100, 4500)).toBe('3,100–4,500 sq ft (288–418 sq m)')
    expect(formatAreaRangeWithMetric(3100, 3100)).toBe('3,100 sq ft (288 sq m)')
  })
})
