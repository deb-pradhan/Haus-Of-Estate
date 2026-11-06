import { describe, expect, it } from 'vitest'
import { activeShowcaseFilters, normalizeShowcaseSearch, showcaseSearchHref, showcaseSearchWithout } from './search'

describe('showcase search parameters', () => {
  it('normalises repeated, padded and invalid values', () => {
    expect(normalizeShowcaseSearch({ country: ['  United Arab Emirates ', 'x'], beds: '4', q: '  Spada   corner ', type: '' }))
      .toEqual({ country: 'United Arab Emirates', beds: 4, q: 'Spada corner' })
    expect(normalizeShowcaseSearch({ beds: 'many', q: 'a'.repeat(200) }).beds).toBeUndefined()
    expect(normalizeShowcaseSearch({ q: 'a'.repeat(200) }).q).toHaveLength(120)
  })

  it('builds showcase catalogue links and drops dependent location filters', () => {
    const search = { country: 'United Arab Emirates', city: 'Sharjah', area: 'Florence', beds: 4 }
    expect(showcaseSearchHref(search)).toBe('/showcase/properties?country=United+Arab+Emirates&city=Sharjah&area=Florence&beds=4')
    expect(showcaseSearchWithout(search, 'country')).toEqual({ beds: 4 })
    expect(showcaseSearchWithout(search, 'city')).toEqual({ country: 'United Arab Emirates', beds: 4 })
    expect(showcaseSearchHref({})).toBe('/showcase/properties')
  })

  it('lists removable filter chips', () => {
    expect(activeShowcaseFilters({ type: 'Villa', beds: 5, q: 'type a' }).map((filter) => [filter.key, filter.label, filter.href])).toEqual([
      ['type', 'Villa', '/showcase/properties?beds=5&q=type+a'],
      ['beds', '5+ bedrooms', '/showcase/properties?type=Villa&q=type+a'],
      ['q', '“type a”', '/showcase/properties?type=Villa&beds=5'],
    ])
  })
})
