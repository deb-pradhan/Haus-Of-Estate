import assert from 'node:assert/strict'
import { test } from 'node:test'
import { describeRemovalEffect, planCoverRemoval } from './cover-removal-plan.mjs'

const target = {
  id: 'aef74ca4-762a-4e73-ae9e-99d540439167',
  slug: 'from-palm-jumeirah-to-difc-how-rapid-execution-powers-dubai-property-growth',
  assetId: 'image-d779c361dcdb87ff32a4eb6208c2bbe6be2accd1-1920x1080-png',
}
const published = {
  _id: target.id, _rev: 'rev-pub', _type: 'post', status: 'published',
  slug: { current: target.slug },
  featuredImage: { _type: 'image', asset: { _type: 'reference', _ref: target.assetId }, alt: 'branded' },
}

test('plans an unset of only the published cover when no draft exists', () => {
  const { plans, notes } = planCoverRemoval(target, [published])
  assert.deepEqual(plans, [{ id: target.id, revision: 'rev-pub', unset: ['featuredImage'] }])
  assert.match(notes[0], /only the cover image reference is removed/)
})

test('clears a native draft only when it still carries the same branded cover', () => {
  const sameDraft = { ...published, _id: `drafts.${target.id}`, _rev: 'rev-draft' }
  assert.deepEqual(planCoverRemoval(target, [published, sameDraft]).plans.map((plan) => plan.id), [target.id, `drafts.${target.id}`])
  const otherDraft = { ...sameDraft, featuredImage: { asset: { _ref: 'image-other' } } }
  const { plans, notes } = planCoverRemoval(target, [published, otherDraft])
  assert.deepEqual(plans.map((plan) => plan.id), [target.id])
  assert.match(notes[1], /different cover/)
})

test('refuses to plan when the identity or cover no longer matches the review', () => {
  assert.throws(() => planCoverRemoval(target, []), /not found/)
  assert.throws(() => planCoverRemoval(target, [{ ...published, slug: { current: 'other' } }]), /identity/)
  assert.throws(() => planCoverRemoval(target, [{ ...published, status: 'draft' }]), /published post/)
  assert.throws(() => planCoverRemoval(target, [{ ...published, featuredImage: undefined }]), /changed since review \(none\)/)
})

test('describes the public effect from the fallback rules', () => {
  assert.match(describeRemovalEffect(target.slug, ['uae-property-market-2026']), /without a hero image/)
  assert.match(describeRemovalEffect('uae-property-market-2026', ['uae-property-market-2026']), /legacy fallback/)
})
