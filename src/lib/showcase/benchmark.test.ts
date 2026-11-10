import { describe, expect, it } from 'vitest'
import { DEFAULT_PLAN_NOTE, formatSnapshotDate, showcaseImageBadge } from './captions'
import { builtUpAreaRangeDual, getShowcaseCatalogue, searchShowcase, showcaseSearchIndex } from './fixture'
import {
  countShowcaseHomes, countShowcaseHomesWith, normalizeShowcaseSearch, showcaseSearchHref, type ShowcaseSearch,
} from './search'

const catalogue = getShowcaseCatalogue()
const index = showcaseSearchIndex(catalogue)

describe('provenance on every showcase record', () => {
  it('names a source and a real snapshot date, and never a brochure publication date', () => {
    for (const property of catalogue.properties) {
      const provenance = property.display.provenance
      expect(provenance, property.slug).toBeDefined()
      expect(provenance!.source.length).toBeGreaterThan(10)
      expect(provenance!.snapshotDate).toMatch(/^2026-11-0[56]$/)
    }
    expect(formatSnapshotDate('2026-11-05')).toBe('5 November 2026')
  })
})

describe('in-frame image labels', () => {
  it('labels every render and concept, and leaves photographs and plans alone', () => {
    expect(showcaseImageBadge({ mediaKind: 'render' })).toBe('Illustration')
    expect(showcaseImageBadge({ mediaKind: 'concept' })).toBe('Illustration · AI concept')
    expect(showcaseImageBadge({ mediaKind: 'concept-comparison' })).toBe('Existing view and AI concept')
    expect(showcaseImageBadge({ mediaKind: 'photo' })).toBeUndefined()
    expect(showcaseImageBadge({ mediaKind: 'floor-plan' })).toBeUndefined()
    expect(showcaseImageBadge({})).toBeUndefined()
  })

  it('gives every Florence image a label, since the fixture holds no photographs of built homes', () => {
    const florence = catalogue.properties.filter((property) => property.kind !== 'property')
    const images = florence.flatMap((property) => [
      property.media.hero, ...property.media.gallery,
      ...property.designs.flatMap((design) => design.images),
      ...property.interiorSchemes.flatMap((scheme) => scheme.images),
    ])
    expect(images.length).toBeGreaterThan(20)
    for (const image of images) expect(showcaseImageBadge(image), image.src).toBeDefined()
  })

  it('has a measurement note ready for plans that arrive without one', () => {
    expect(DEFAULT_PLAN_NOTE).toMatch(/approximate/)
    const plans = catalogue.properties.flatMap((property) => [...property.floorPlans, ...property.designs.flatMap((design) => design.floorPlans)])
    expect(plans.some((plan) => !plan.caption)).toBe(true)
  })
})

describe('count-aware search', () => {
  const searches: ShowcaseSearch[] = [
    {}, { country: 'United Arab Emirates' }, { country: 'United Kingdom' }, { country: 'United Kingdom', beds: 5 },
    { type: 'Townhouse' }, { type: 'Villa', beds: 5 }, { beds: 3 }, { beds: 6 }, { q: 'Spada' }, { q: 'Florence' },
    { q: 'North London' }, { q: 'no such place' }, { country: 'United Arab Emirates', city: 'Sharjah', area: 'Florence', type: 'Townhouse' },
    { q: 'Sheikh Mohammed' }, { q: 'Sheikh Mohammed', type: 'Villa' },
  ]

  it('counts exactly the homes the catalogue would show, for every kind of search', () => {
    for (const search of searches) {
      expect(countShowcaseHomes(index, search), JSON.stringify(search)).toBe(searchShowcase(search, catalogue).homeCount)
    }
    expect(countShowcaseHomes(index, {})).toBe(6)
  })

  it('tells a buyer what each choice would leave before they choose it', () => {
    expect(countShowcaseHomesWith(index, {}, 'country', 'United Kingdom')).toBe(1)
    expect(countShowcaseHomesWith(index, {}, 'type', 'Townhouse')).toBe(2)
    expect(countShowcaseHomesWith(index, { country: 'United Kingdom' }, 'beds', 5)).toBe(0)
    // Choosing another country clears the narrower place filters it would contradict.
    expect(countShowcaseHomesWith(index, { country: 'United Arab Emirates', city: 'Sharjah', area: 'Florence' }, 'country', 'United Kingdom')).toBe(1)
  })
})

describe('sorting', () => {
  it('accepts only the supported orders and keeps the default out of the URL', () => {
    expect(normalizeShowcaseSearch({ sort: 'size-desc' }).sort).toBe('size-desc')
    expect(normalizeShowcaseSearch({ sort: 'price' }).sort).toBeUndefined()
    expect(showcaseSearchHref({ type: 'Villa', sort: 'curated' })).toBe('/showcase/properties?type=Villa')
    expect(showcaseSearchHref({ type: 'Villa', sort: 'size-asc' })).toBe('/showcase/properties?type=Villa&sort=size-asc')
  })

  it('orders the collections inside each home type by size without changing what is shown', () => {
    const largest = (search: ShowcaseSearch) => searchShowcase(search, catalogue).communities[0].groups
      .map((group) => group.collections.map((collection) => Math.max(...collection.designs.map((design) => design.builtUpAreaSqFt))))
    for (const sizes of largest({ sort: 'size-asc' })) expect(sizes).toEqual([...sizes].sort((a, b) => a - b))
    for (const sizes of largest({ sort: 'size-desc' })) expect(sizes).toEqual([...sizes].sort((a, b) => b - a))
    expect(searchShowcase({ sort: 'size-desc' }, catalogue).homeCount).toBe(searchShowcase({}, catalogue).homeCount)
  })
})

describe('area units', () => {
  it('shows a collection’s built-up range in square feet with its square-metre conversion', () => {
    const villas = catalogue.properties.find((property) => property.slug === 'azizi-florence-4-bedroom-villas')!
    expect(builtUpAreaRangeDual(villas)).toMatch(/^[\d,]+(–[\d,]+)? sq ft \([\d,]+(–[\d,]+)? sq m\)$/)
  })
})

describe('label placement and reader-facing copy', () => {
  it('keeps a concept board’s label clear of the BEFORE and AFTER tags along its bottom edge', async () => {
    const { showcaseImageBadgePosition } = await import('./captions')
    expect(showcaseImageBadgePosition({ mediaKind: 'concept-comparison' })).toBe('top')
    expect(showcaseImageBadgePosition({ mediaKind: 'concept' })).toBe('top')
    expect(showcaseImageBadgePosition({ mediaKind: 'render' })).toBe('bottom')
  })

  it('never shows a reader an instruction written for the people building the page', () => {
    for (const property of catalogue.properties) {
      const copy = Object.values(property.display).filter((value): value is string => typeof value === 'string').join(' ')
      expect(copy, property.slug).not.toMatch(/\b(preserve|retain|do not|never|must)\b/i)
    }
  })
})
