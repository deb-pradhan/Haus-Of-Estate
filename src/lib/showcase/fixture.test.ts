import { describe, expect, it } from 'vitest'
import {
  builtUpAreaRange,
  collectionLabel,
  findShowcaseCommunity,
  findShowcaseDesign,
  findShowcaseProperty,
  getShowcaseCatalogue,
  searchShowcase,
  showcaseBedroomOptions,
  showcaseLocationGroups,
  showcaseTypeOptions,
} from './fixture'

describe('showcase fixture adapter', () => {
  const catalogue = getShowcaseCatalogue()

  it('loads one community with five collections, nineteen designs and one ready home', () => {
    expect(catalogue.properties).toHaveLength(7)
    expect(catalogue.communities).toHaveLength(1)
    const [florence] = catalogue.communities
    expect(florence.overview.slug).toBe('azizi-florence')
    expect(florence.collections).toHaveLength(5)
    expect(florence.designCount).toBe(19)
    expect(florence.groups.map((group) => [group.id, group.collections.map((item) => item.bedrooms)])).toEqual([
      ['villas', [4, 5, 6]],
      ['townhouses', [3, 4]],
    ])
    expect(catalogue.readyHomes.map((home) => home.slug)).toEqual(['north-london-three-bedroom-property'])
  })

  it('never emits Florence prices, sizes or availability', () => {
    for (const property of catalogue.properties.filter((item) => item.kind !== 'property')) {
      expect(property.price).toBeUndefined()
      expect(property.sizeDisplay).toBeUndefined()
      expect(property.display.brochureMode).toBe('simulated-only')
      expect(property.display.inventoryNotice).toMatch(/Contact sales/)
    }
  })

  it('keeps the London asking price, approximate area and comparison captions', () => {
    const london = findShowcaseProperty('north-london-three-bedroom-property')!
    expect(london.price).toEqual({ amount: 500000, currency: 'GBP', display: '£500,000' })
    expect(london.sizeDisplay).toContain('889.9 sq ft / 82.67 m²')
    expect(london.display.areaLabel).toBe('Approximate gross internal floor area')
    expect(london.media.hero.mediaKind).toBe('concept-comparison')
    expect(london.media.hero.caption).toMatch(/AFTER are concepts/)
    expect(london.floorPlans[0]?.caption).toMatch(/approximate and for guidance only/i)
    expect(london.community).toBe('North London')
  })

  it('withholds disputed plot figures and keeps their explanatory note', () => {
    const townhouses = findShowcaseProperty('azizi-florence-4-bedroom-townhouses')!
    for (const key of ['novoli-4-home-corner', 'novoli-6-home-corner', 'spada-8-home-corner']) {
      const design = findShowcaseDesign(townhouses, key)!
      expect(design.plotAreaStatus).toBe('conflict')
      expect(design.plotAreaSqFt).toBeUndefined()
      expect(design.areaNote).toMatch(/withheld/i)
    }
    const spada = findShowcaseDesign(townhouses, 'spada-4-home-corner')!
    expect(spada.plotAreaSqFt).toBe(2260)
    expect(spada.builtUpAreaSqFt).toBe(2709)
    expect(spada.floorPlans.map((plan) => plan.label)).toEqual(['Ground floor — whole row', 'First floor — whole row'])
  })

  it('labels areas as built-up with the source explanation and derives collection labels', () => {
    const villas = findShowcaseProperty('azizi-florence-4-bedroom-villas')!
    expect(villas.display.areaLabel).toBe('Built-up area')
    expect(villas.display.areaSourceLabel).toMatch(/sellable area/)
    expect(builtUpAreaRange(villas)).toBe('3,714–3,831 sq ft')
    expect(collectionLabel(villas)).toBe('4-bedroom villas')
    expect(findShowcaseCommunity(villas)?.overview.title).toBe('Azizi Florence')
  })

  it('only references the Sanity CDN', () => {
    const sources = catalogue.properties.flatMap((property) => [
      property.media.hero.src,
      ...property.media.gallery.map((image) => image.src),
      ...property.floorPlans.map((plan) => plan.src),
      ...property.designs.flatMap((design) => [...design.images, ...design.floorPlans].map((image) => image.src)),
      ...property.interiorSchemes.flatMap((scheme) => scheme.images.map((image) => image.src)),
    ])
    expect(sources.length).toBeGreaterThan(80)
    expect(sources.every((src) => src.startsWith('https://cdn.sanity.io/images/jdxbkry4/production/'))).toBe(true)
  })

  it('builds country → city → area options from the fixture', () => {
    expect(showcaseLocationGroups()).toEqual([
      { country: 'United Arab Emirates', cities: ['Sharjah'], areasByCity: { Sharjah: ['Florence'] } },
      { country: 'United Kingdom', cities: ['London'], areasByCity: { London: ['North London'] } },
    ])
    expect(showcaseTypeOptions()).toEqual(['Villa', 'Townhouse', 'Terraced House'])
    expect(showcaseBedroomOptions()).toEqual([3, 4, 5, 6])
  })

  it('searches by place, type, bedrooms and keyword', () => {
    expect(searchShowcase({}).total).toBe(2)
    const uk = searchShowcase({ country: 'United Kingdom' })
    expect(uk.communities).toHaveLength(0)
    expect(uk.readyHomes.map((home) => home.slug)).toEqual(['north-london-three-bedroom-property'])

    const fiveBeds = searchShowcase({ beds: 5 })
    expect(fiveBeds.readyHomes).toHaveLength(0)
    expect(fiveBeds.communities[0].collections.map((item) => item.slug)).toEqual([
      'azizi-florence-5-bedroom-villas', 'azizi-florence-6-bedroom-villas',
    ])
    expect(fiveBeds.communities[0].groups.map((group) => group.id)).toEqual(['villas'])

    const townhouses = searchShowcase({ type: 'Townhouse', area: 'Florence' })
    expect(townhouses.collectionCount).toBe(2)

    const spada = searchShowcase({ q: 'spada' })
    expect(spada.communities[0].collections.map((item) => item.bedrooms)).toEqual([3, 4])

    expect(searchShowcase({ q: 'nothing matches this' }).total).toBe(0)
    expect(searchShowcase({ country: 'United Arab Emirates', type: 'Terraced House' }).total).toBe(0)
  })
})
