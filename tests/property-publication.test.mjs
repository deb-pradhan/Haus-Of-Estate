import assert from 'node:assert/strict'
import test from 'node:test'
import { parse, evaluate } from 'groq-js'
import * as queries from '../src/sanity/queries.ts'

const imageId = 'image-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa-1600x900-jpg'
const slug = 'test-three-bedroom-property'
const document = {
  _id: 'test-property', _type: 'property', status: 'published',
  title: 'Three-bedroom property', slug: { current: slug },
  featured: false, category: 'residential', availability: ['ready'],
  listingType: ['sale'], unitType: 'Terraced House',
  floorPlans: [{ _type: 'image', asset: { _ref: imageId }, alt: 'Plan', caption: 'Approximate measurements' }],
}
const dataset = [
  document,
  { ...document, _id: 'drafts.test-property', title: 'Hidden draft' },
  { ...document, _id: 'versions.release.test-property', title: 'Hidden version' },
  { ...document, _id: 'pending', status: 'draft', title: 'Pending property' },
  { _id: imageId, _type: 'sanity.imageAsset', url: 'https://cdn.sanity.io/images/test1234/test/plan.png' },
]
const params = { category: '', availability: '', intent: '', type: '', slug }
const run = async (query, records = dataset) => (await evaluate(parse(query), { dataset: records, params })).get()

test('public property discovery excludes native drafts and release versions even with published workflow status', async () => {
  for (const query of [queries.PROPERTIES_QUERY, queries.PROPERTIES_FILTERED_QUERY, queries.PROPERTY_SLUGS_QUERY]) {
    const result = await run(query)
    assert.equal(result.length, 1)
    assert.equal(result[0].slug, slug)
  }
  assert.equal(await run(queries.PROPERTY_BY_SLUG_QUERY, dataset.filter((item) => item._id !== document._id)), null)
})

test('published detail projects a full plan asset with its alt text and measurement disclaimer', async () => {
  const detail = await run(queries.PROPERTY_BY_SLUG_QUERY)
  assert.equal(detail.title, document.title)
  assert.deepEqual(detail.floorPlans, [{
    src: 'https://cdn.sanity.io/images/test1234/test/plan.png',
    alt: 'Plan', caption: 'Approximate measurements', mediaKind: null,
  }])
})

test('publication alone does not automatically feature a property on the homepage', async () => {
  assert.deepEqual(await run(queries.FEATURED_PROPERTIES_QUERY), [])
  const featured = dataset.map((item) => ({ ...item, featured: true }))
  const result = await run(queries.FEATURED_PROPERTIES_QUERY, featured)
  assert.equal(result.length, 1)
  assert.equal(result[0]._id, document._id)
})
