import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { evaluate, parse } from 'groq-js'
import { preparePublicHomeTypes, matchesPropertyBedrooms } from '../src/lib/property-home-types.ts'
import { PROPERTY_BY_SLUG_QUERY, PROPERTIES_FILTERED_QUERY } from '../src/sanity/queries.ts'

const draft = JSON.parse(await readFile(new URL('../scripts/kore-wellness-residence.staging-draft.ndjson', import.meta.url), 'utf8'))

test('Kore draft preserves the supplied figures and does not invent missing specifications or publication', () => {
  assert.equal(draft._id, 'drafts.kore-wellness-residence')
  assert.equal(draft.slug.current, 'kore-wellness-residence')
  assert.equal(draft.status, 'draft')
  assert.equal(draft.featured, false)
  assert.equal(draft.unitType, 'Apartment')
  assert.equal(draft.targetCompletion, 'Q4 2028')
  assert.deepEqual(draft.homeTypes.map(({ bedrooms, startingSizeSqFt, startingPrice, priceCurrency }) =>
    [bedrooms, startingSizeSqFt, startingPrice, priceCurrency]), [
    [0, 406, 679000, 'AED'], [1, 669, 1100000, 'AED'], [2, 1406, 1550000, 'AED'],
  ])
  assert.equal(draft.priceAmount, Math.min(...draft.homeTypes.map((row) => row.startingPrice)))
  assert.match(draft.paymentPlan, /40% paid over three years after handover and a 10% price increase/)
  for (const key of ['bedrooms', 'bathrooms', 'sizeDisplay', 'plotSizeDisplay', 'featuredImage', 'gallery', 'floorPlans', 'publishedAt', 'editorialApproval', 'eoiAmount']) {
    assert.equal(Object.hasOwn(draft, key), false, key)
  }
  assert.doesNotMatch(JSON.stringify(draft), /built.up area|sellable|freehold|fully furnished|guaranteed/i)
})

test('public home schedules discard invalid figures and private evidence without altering valid source values', () => {
  const valid = draft.homeTypes[0]
  const rows = preparePublicHomeTypes([
    { ...valid, verification: 'PRIVATE' },
    { ...valid, _key: 'zero-price', startingPrice: 0 },
    { ...valid, _key: 'negative-size', startingSizeSqFt: -406 },
    { ...valid, _key: 'nonfinite', startingPrice: Infinity },
    { ...valid, _key: 'fractional-bed', bedrooms: 1.5 },
    { ...valid, _key: 'no-currency', priceCurrency: '' },
  ])
  assert.equal(rows.length, 1)
  assert.equal(rows[0].bedrooms, 0)
  assert.equal(rows[0].startingPrice, 679000)
  assert.equal(rows[0].startingSizeSqFt, 406)
  assert.doesNotMatch(JSON.stringify(rows), /PRIVATE/)
})

test('bedroom filtering finds a mixed development without inventing one main bedroom count', () => {
  assert.equal(matchesPropertyBedrooms(draft, 0), true)
  assert.equal(matchesPropertyBedrooms(draft, 1), true)
  assert.equal(matchesPropertyBedrooms(draft, 2), true)
  assert.equal(matchesPropertyBedrooms(draft, 3), false)
  assert.equal(matchesPropertyBedrooms({ bedrooms: 4 }, 3), true)
  assert.equal(matchesPropertyBedrooms({ bedrooms: 1 }, 0), false)
  assert.equal(matchesPropertyBedrooms({ bedrooms: 0 }, 0), true)
  assert.equal(matchesPropertyBedrooms({}, 0), false)
})

test('Kore uses standard published queries, excludes drafts and never exposes home-type evidence fields', async () => {
  const published = { ...draft, _id: 'kore-wellness-residence', status: 'published', homeTypes: draft.homeTypes.map((row) => ({ ...row, sourceEvidence: 'PRIVATE' })) }
  const dataset = [draft, published]
  const params = { slug: draft.slug.current, category: '', availability: '', intent: '', type: '' }
  const detail = await (await evaluate(parse(PROPERTY_BY_SLUG_QUERY), { dataset, params })).get()
  const cards = await (await evaluate(parse(PROPERTIES_FILTERED_QUERY), { dataset, params })).get()
  assert.equal(detail._id, published._id)
  assert.equal(detail.targetCompletion, 'Q4 2028')
  assert.equal(detail.homeTypes.length, 3)
  assert.deepEqual(cards.map((row) => row._id), [published._id])
  assert.equal(cards[0].homeTypes[0].bedrooms, 0)
  assert.doesNotMatch(JSON.stringify(detail), /PRIVATE/)
  assert.doesNotMatch(JSON.stringify(cards), /PRIVATE/)
})
