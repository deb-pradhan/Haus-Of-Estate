import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import test from 'node:test'
import {assertDraftSafe, assertNoExistingMatches, buildDraft, validatePayload} from './prepare-cardiff-commercial.mjs'

const payload = JSON.parse(await readFile(new URL('./data/cardiff-commercial-2026-09-21.json', import.meta.url), 'utf8'))

test('the three reviewed sources retain distinct monthly rents and advertised areas', () => {
  validatePayload(payload)
  const docs = payload.entries.map(buildDraft)
  assert.deepEqual(docs.map(doc => doc.rentAmount), [1250, 1500, 2000])
  assert.deepEqual(docs.map(doc => doc.sizeDisplay), [
    '285 sq ft (approximately 26.48 m²), advertised total',
    '240 sq ft (approximately 22.30 m²), advertised total',
    '325 sq ft (approximately 30.19 m²), advertised total',
  ])
  docs.forEach(doc => {
    assertDraftSafe(doc)
    assert.equal(doc._id, 'drafts.')
    assert.equal(doc.rentPeriod, 'month')
    assert.equal(doc.rentCurrency, 'GBP')
    assert.equal(doc.showHausLogo, true)
  })
})

test('unidentified warehouse, duplicate identities and changed commercial figures fail closed', () => {
  for (const mutate of [
    copy => {copy.entries[0].sourceId = 'warehouse'},
    copy => {copy.entries[1].sourceId = copy.entries[0].sourceId},
    copy => {copy.entries[1].slug = copy.entries[0].slug},
    copy => {copy.entries[0].rentAmount = 1200},
    copy => {copy.entries[0].headlineSqFt = 280},
    copy => {copy.dataset = 'staging'},
    copy => {copy.entries[0].photoUrls.pop()},
  ]) {
    const copy = structuredClone(payload)
    mutate(copy)
    assert.throws(() => validatePayload(copy))
  }
})

test('published states, explicit identities and unsupported facts cannot reach the create request', () => {
  for (const mutation of [
    {_id: 'property-cardiff'}, {_id: 'drafts.my-guessed-unit'}, {status: 'published'},
    {featured: true}, {bedrooms: 0}, {bathrooms: 1}, {unitNumber: 'A'},
    {publishedAt: '2026-09-21T10:00:00Z'}, {listingState: 'active'},
    {completionStatus: 'completed'}, {priceAmount: 1250}, {listingType: ['sale']},
    {availability: ['off-plan']}, {rentCurrency: 'AED'}, {rentPeriod: 'week'},
    {verification: {status: 'verified'}},
  ]) assert.throws(() => assertDraftSafe({...buildDraft(payload.entries[0]), ...mutation}))
})

test('draft copy preserves measured-area conflicts and does not invent a current availability guarantee', () => {
  for (const entry of payload.entries) {
    const doc = buildDraft(entry)
    assert.match(doc.verification.notes, /Component total is five sq ft below the headline/)
    assert.match(doc.verification.notes, /not fresh agent confirmation/)
    assert.match(doc.verification.notes, /fit-out work/)
    assert.match(doc.summary, /subject to confirmation/)
    assert.equal(doc.verification.sourceUrl, entry.sourceUrl)
    assert.ok(!('unitNumber' in doc))
    assert.ok(!('publishedAt' in doc))
  }
})

test('any existing draft or published source match stops create-only import, including retry after an uncertain response', () => {
  assert.doesNotThrow(() => assertNoExistingMatches([]))
  assert.throws(() => assertNoExistingMatches([{_id: 'drafts.existing'}]))
  assert.throws(() => assertNoExistingMatches([{_id: 'existing'}]))
})
