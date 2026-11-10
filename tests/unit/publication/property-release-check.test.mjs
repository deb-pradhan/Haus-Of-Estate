import assert from 'node:assert/strict'
import { test } from 'vitest'
import { auditPropertyRelease, RELEASE_PROPERTIES } from '../../../scripts/check-property-release.mjs'

const image = { _type: 'image', asset: { _type: 'reference', _ref: 'image-example-1200x800-jpg' } }
const assets = [{ _id: image.asset._ref, _type: 'sanity.imageAsset', hasUrl: true }]
const records = RELEASE_PROPERTIES.map((target) => ({
  _id: `drafts.${target.id}`, _type: 'property', _rev: 'current', status: 'draft', slug: { current: target.slug },
  unitType: target.type, bedrooms: target.bedrooms, featuredImage: target.slug.startsWith('azizi') ? image : undefined,
  designVariants: Array.from({ length: target.designs }, (_, index) => ({ _key: `design-${index}`, images: [image], floorPlans: [image] })),
}))

test('pre-publication read reports native drafts and revisions without claiming approval or publication', () => {
  const audit = auditPropertyRelease(records, assets)
  assert.deepEqual(audit.issues, [])
  assert.equal(audit.records.length, 7)
  assert.ok(audit.records.every((record) => record.draft.revision === 'current' && !record.published && record.recordedApproval === null))
  assert.ok(auditPropertyRelease(records, assets, { expectPublished: true }).issues.every((issue) => issue.includes('published document is missing')))
})

test('native draft and its published identity are allowed; another record with the same slug is rejected', () => {
  const published = { ...records[0], _id: RELEASE_PROPERTIES[0].id, status: 'published' }
  assert.deepEqual(auditPropertyRelease([...records, published], assets).issues, [])
  assert.match(auditPropertyRelease([...records, { ...published, _id: 'unintended-duplicate' }], assets).issues.join('\n'), /another identity uses this slug/)
})

test('missing assets, changed identity and lost disputed-plot protection are visible before publication', () => {
  const changed = structuredClone(records)
  changed[1].bedrooms = 3
  changed[5].designVariants[0]._key = 'novoli-4-home-corner'
  const issues = auditPropertyRelease(changed, []).issues.join('\n')
  assert.match(issues, /bedroom count differs/)
  assert.match(issues, /disputed plot must retain the conflict marker/)
  assert.match(issues, /image asset references do not resolve/)
})

test('published checks use the actual public version and flag stale status even when a newer draft is valid', () => {
  const published = records.map((doc) => ({ ...doc, _id: doc._id.replace('drafts.', ''), status: 'published' }))
  assert.deepEqual(auditPropertyRelease([...records, ...published], assets, { expectPublished: true }).issues, [])
  published[0].status = 'draft'
  assert.match(auditPropertyRelease([...records, ...published], assets, { expectPublished: true }).issues.join('\n'), /website status is not Published/)
})
