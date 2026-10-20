import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluate, parse } from 'groq-js'
import { PROPERTIES_FILTERED_QUERY, PROPERTY_DEVELOPMENTS_QUERY, PROPERTY_BY_SLUG_QUERY, PROPERTY_SLUGS_QUERY } from '../src/sanity/queries.ts'
import { groupDevelopmentResults, developmentStartingPrice } from '../src/lib/property-developments.ts'
import { preparePublicDesigns } from '../src/lib/property-designs.ts'

const overview = {
  _type: 'property', _id: 'community', status: 'published', slug: { current: 'community' },
  title: 'Example community', unitType: 'Development', community: 'Example', city: 'Sharjah', country: 'United Arab Emirates',
}
const villa = {
  ...overview, _id: 'villa', slug: { current: 'villa' }, title: 'Villa collection', unitType: 'Villa',
  masterDevelopment: overview.title, bedrooms: 4, category: 'residential', availability: ['off-plan'], listingType: ['sale'],
  priceAmount: 3350000, priceCurrency: 'AED', priceDisplay: 'AED 3,350,000–5,115,000 · Clusters 1 & 2',
}
const townhouse = { ...villa, _id: 'townhouse', slug: { current: 'townhouse' }, unitType: 'Townhouse', bedrooms: 3, priceAmount: 1890000 }
const dataset = [overview, villa, townhouse]
async function query(source, data = dataset, params = {}) {
  return (await evaluate(parse(source), { dataset: data, params })).get()
}

test('public queries exclude native drafts, versions and perspective-remapped drafts', async () => {
  const privateRecords = [
    { ...overview, _id: 'drafts.secret', title: 'SECRET' },
    { ...overview, _id: 'versions.release.secret', title: 'SECRET' },
    { ...overview, _id: 'remapped', _originalId: 'drafts.secret', title: 'SECRET' },
    { ...overview, _id: 'remapped-version', _originalId: 'versions.release.secret', title: 'SECRET' },
    { ...overview, _id: 'not-published', status: 'draft', title: 'SECRET' },
  ]
  for (const source of [PROPERTIES_FILTERED_QUERY, PROPERTY_DEVELOPMENTS_QUERY, PROPERTY_SLUGS_QUERY, PROPERTY_BY_SLUG_QUERY]) {
    const output = await query(source, privateRecords, { category: '', availability: '', intent: '', type: '', slug: 'community' })
    assert.ok(output === null || output.length === 0, source)
  }
})

test('public community relationship requires matching country, city, community and parent title', async () => {
  const unrelated = [
    { ...villa, _id: 'wrong-city', city: 'Dubai' },
    { ...villa, _id: 'wrong-country', country: 'United Kingdom' },
    { ...villa, _id: 'wrong-community', community: 'Elsewhere' },
    { ...villa, _id: 'wrong-parent', masterDevelopment: 'Other' },
    { ...villa, _id: 'drafts.child' },
  ]
  const [group] = await query(PROPERTY_DEVELOPMENTS_QUERY, [...dataset, ...unrelated])
  assert.deepEqual(group.collections.map((home) => home._id).sort(), ['townhouse', 'villa'])
})

test('catalogue groups matching collections once without losing unmatched independent listings', async () => {
  const groups = await query(PROPERTY_DEVELOPMENTS_QUERY)
  const independent = { ...villa, _id: 'independent', masterDevelopment: 'Other' }
  const output = groupDevelopmentResults([...dataset, independent], groups)
  assert.equal(output.groups.length, 1)
  assert.equal(output.groups[0].collections.length, 2)
  assert.deepEqual(output.properties.map((home) => home._id), ['independent'])
  // Filtering for villas still leads to the community, with only matching homes/prices.
  const filtered = groupDevelopmentResults([villa], groups)
  assert.deepEqual(filtered.groups[0].collections.map((home) => home._id), ['villa'])
  assert.equal(filtered.properties.length, 0)
  // No published parent means no link to a draft-only community.
  assert.equal(groupDevelopmentResults([villa], []).properties.length, 1)
})

test('type, sale and location grouping cannot reveal nonmatching collections', async () => {
  const result = await query(PROPERTIES_FILTERED_QUERY, dataset, { category: 'residential', availability: 'off-plan', intent: 'sale', type: 'Townhouse' })
  assert.deepEqual(result.map((home) => home._id), ['townhouse'])
  const groups = await query(PROPERTY_DEVELOPMENTS_QUERY)
  assert.deepEqual(groupDevelopmentResults(result, groups).groups[0].collections.map((home) => home._id), ['townhouse'])
})

test('starting prices retain currency and scope and never combine incomplete or mixed currencies', () => {
  assert.deepEqual(developmentStartingPrice([villa, townhouse]), { amount: 1890000, currency: 'AED', scope: 'Clusters 1 & 2' })
  assert.equal(developmentStartingPrice([villa, { ...townhouse, priceCurrency: 'GBP' }]), undefined)
  assert.equal(developmentStartingPrice([villa, { ...townhouse, priceAmount: undefined }]), undefined)
  assert.equal(developmentStartingPrice([{ ...villa, priceAmount: NaN }]), undefined)
})

test('detail projection excludes disputed plot figures and private brochure/source evidence', async () => {
  const source = {
    ...villa,
    verification: { notes: 'PRIVATE SOURCE' },
    designVariants: [{
      _key: 'corner', label: 'Corner design', sellableAreaSqFt: 2663,
      plotAreaSqFt: 2260, plotAreaStatus: 'conflict', areaNote: 'PRIVATE SOURCE',
      brochureKey: 'PRIVATE BROCHURE', sourceEvidence: 'PRIVATE SOURCE',
      images: [], floorPlans: [],
    }],
  }
  const result = await query(PROPERTY_BY_SLUG_QUERY, [source], { slug: 'villa' })
  assert.equal(result.designVariants[0].plotAreaSqFt, null)
  assert.doesNotMatch(JSON.stringify(result), /PRIVATE|2260/)
  const sanitized = preparePublicDesigns(result.designVariants)
  assert.equal(sanitized[0].sellableAreaSqFt, 2663)
  assert.equal(sanitized[0].plotAreaSqFt, undefined)
})
