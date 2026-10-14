import { evaluate, parse } from 'groq-js'
import { describe, expect, it } from 'vitest'
import { PROPERTY_DEVELOPMENTS_QUERY } from '@/sanity/queries'
import { belongsToDevelopment, developmentStartingPrice, findPropertyDevelopment, groupDevelopmentResults, type DevelopmentProperty, type PropertyDevelopment } from './property-developments'

const overview: PropertyDevelopment = {
  _id: 'florence', title: 'Azizi Florence', slug: 'azizi-florence', unitType: 'Development',
  community: 'Florence', city: 'Sharjah', country: 'United Arab Emirates', summary: 'Community overview.', collections: [],
}
const villa: DevelopmentProperty = {
  ...overview, _id: 'villa', slug: 'florence-villas', title: 'Florence villas', unitType: 'Villa', bedrooms: 4,
  masterDevelopment: overview.title, priceAmount: 3_350_000, priceCurrency: 'AED', priceDisplay: 'AED 3,350,000–5,115,000 · Clusters 1 & 2',
}
const townhouse: DevelopmentProperty = {
  ...villa, _id: 'townhouse', slug: 'florence-townhouses', title: 'Florence townhouses', unitType: 'Townhouse', bedrooms: 3,
  priceAmount: 1_890_000, priceDisplay: 'AED 1,890,000–3,017,000 · Clusters 1 & 2',
}
const development = { ...overview, collections: [villa, townhouse] }

describe('published development navigation', () => {
  it('evaluates the public query without leaking draft, version, withdrawn or unrelated collections', async () => {
    const document = (property: DevelopmentProperty, fields: Record<string, unknown> = {}) => ({
      ...property, _type: 'property', status: 'published', slug: { current: property.slug }, ...fields,
    })
    const dataset = [document(overview), document(villa), document(townhouse),
      document(villa, { _id: 'drafts.villa' }), document(villa, { _id: 'versions.release.villa' }),
      document(villa, { _id: 'normalized-draft', _originalId: 'drafts.normalized-draft' }),
      document(villa, { _id: 'normalized-version', _originalId: 'versions.release.normalized-version' }),
      document(villa, { _id: 'unpublished', status: 'draft' }),
      document(villa, { _id: 'withdrawn', listingState: 'withdrawn' }),
      document(villa, { _id: 'sold', listingState: 'sold' }),
      document(villa, { _id: 'wrong-project', masterDevelopment: 'Different development' }),
      document(villa, { _id: 'wrong-market', country: 'United Kingdom' }),
      document(overview, { _id: 'drafts.overview' }),
      document(overview, { _id: 'hidden-overview', status: 'draft' }),
    ]
    const result = await (await evaluate(parse(PROPERTY_DEVELOPMENTS_QUERY), { dataset })).get()
    expect(result).toHaveLength(1)
    expect(result[0]._id).toBe('florence')
    expect(result[0].collections.map((home: DevelopmentProperty) => home._id)).toEqual(['townhouse', 'villa'])
  })

  it('groups six-style collection results once while preserving unrelated properties', () => {
    const london = { ...villa, _id: 'london', masterDevelopment: undefined, country: 'United Kingdom' }
    const result = groupDevelopmentResults([overview, villa, townhouse, london], [development])
    expect(result.groups).toEqual([development])
    expect(result.properties).toEqual([london])
  })

  it('retains a published overview for matching children and derives prices only from the filtered children', () => {
    const expensiveVilla = { ...villa, _id: 'five-bed', bedrooms: 5, priceAmount: 4_200_000 }
    const result = groupDevelopmentResults([expensiveVilla], [{ ...development, collections: [villa, townhouse, expensiveVilla] }])
    expect(result.groups).toHaveLength(1)
    expect(result.groups[0].collections).toEqual([expensiveVilla])
    expect(developmentStartingPrice(result.groups[0].collections)?.amount).toBe(4_200_000)
    expect(result.properties).toEqual([])
  })

  it('does not invent children when only an overview matches or the published parent is absent', () => {
    expect(groupDevelopmentResults([overview], [development]).groups[0].collections).toEqual([])
    expect(groupDevelopmentResults([villa], []).properties).toEqual([villa])
    expect(groupDevelopmentResults([], [development]).groups).toEqual([])
    expect(findPropertyDevelopment(villa, [])).toBeUndefined()
  })

  it('requires the full existing relationship before adding a parent breadcrumb or grouping', () => {
    expect(findPropertyDevelopment(villa, [development])?.slug).toBe('azizi-florence')
    expect(belongsToDevelopment({ ...villa, country: 'United Kingdom' }, overview)).toBe(false)
    expect(belongsToDevelopment({ ...villa, city: 'Dubai' }, overview)).toBe(false)
    expect(belongsToDevelopment({ ...villa, masterDevelopment: 'Other' }, overview)).toBe(false)
  })

  it('withholds group prices for missing or mixed quotes and retains scope only when every member has it', () => {
    expect(developmentStartingPrice([villa, townhouse])).toEqual({ amount: 1_890_000, currency: 'AED', scope: 'Clusters 1 & 2' })
    expect(developmentStartingPrice([villa, { ...townhouse, priceAmount: undefined }])).toBeUndefined()
    expect(developmentStartingPrice([villa, { ...townhouse, priceCurrency: 'GBP' }])).toBeUndefined()
    expect(developmentStartingPrice([villa, { ...townhouse, priceDisplay: undefined }])?.scope).toBeUndefined()
  })
})
