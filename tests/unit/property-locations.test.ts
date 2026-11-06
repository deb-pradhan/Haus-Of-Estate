import { describe, expect, it } from 'vitest'
import { buildPropertyLocationGroups, matchesPropertyLocation } from '../../src/lib/property-locations'

describe('property location hierarchy', () => {
  it('deduplicates location spelling and keeps areas inside their own city', () => {
    expect(buildPropertyLocationGroups([
      { country: 'United Kingdom', city: 'London', community: 'Canary Wharf' },
      { country: ' united   kingdom ', city: ' LONDON ', community: 'canary   wharf' },
      { country: 'United Kingdom', city: 'London', community: 'Shoreditch' },
      { country: 'United Arab Emirates', city: 'Dubai', community: 'Downtown' },
      { country: 'United Arab Emirates', city: 'Sharjah', community: 'Downtown' },
      { country: 'United Arab Emirates', city: 'Sharjah', community: 'Florence' },
      { country: '', city: 'Private place', community: 'Not included' },
      { country: 'United Kingdom', city: null, community: 'Not included' },
      { country: 'United Kingdom', city: 'Bristol', community: '' },
    ])).toEqual([
      { country: 'United Arab Emirates', cities: ['Dubai', 'Sharjah'], areasByCity: {
        Dubai: ['Downtown'], Sharjah: ['Downtown', 'Florence'],
      } },
      { country: 'United Kingdom', cities: ['Bristol', 'London'], areasByCity: {
        Bristol: [], London: ['Canary Wharf', 'Shoreditch'],
      } },
    ])
  })

  it('treats area values as literal community names, not address or keyword matches', () => {
    const property = { country: 'United Kingdom', city: 'London', community: 'Canary Wharf', masterDevelopment: 'Riverside' }
    expect(matchesPropertyLocation(property, { country: ' united kingdom ', city: 'LONDON', area: ' canary   WHARF ' })).toBe(true)
    expect(matchesPropertyLocation(property, { city: 'Bristol', area: 'Canary Wharf' })).toBe(false)
    expect(matchesPropertyLocation(property, { area: 'Canary' })).toBe(false)
    expect(matchesPropertyLocation(property, { area: 'Riverside' })).toBe(false)
    expect(matchesPropertyLocation({ city: 'London' }, { area: 'Canary Wharf' })).toBe(false)
    expect(matchesPropertyLocation(property, { location: 'canary' })).toBe(true)
    expect(matchesPropertyLocation(property, { location: 'riverside' })).toBe(true)
  })
})
