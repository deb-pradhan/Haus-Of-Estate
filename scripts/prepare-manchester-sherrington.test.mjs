import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {validatePayload, assertNoExistingMatches} from './prepare-manchester-sherrington.mjs'

const reviewed = JSON.parse(await readFile(new URL('./data/manchester-sherrington-2026-09-21.json', import.meta.url), 'utf8'))

test('reviewed payload passes without modifying the source', () => {
  const payload = structuredClone(reviewed)
  validatePayload(payload)
  assert.deepEqual(payload, reviewed)
})

test('publication, supplied identity and inferred approval are rejected', () => {
  for (const change of [
    doc => { doc.status = 'published' },
    doc => { doc._id = 'drafts.fixed' },
    doc => { doc.publishedAt = '2026-09-21T12:00:00Z' },
    doc => { doc.editorialApproval.contentApproved = true },
    doc => { doc.verification.status = 'verified' },
  ]) {
    const payload = structuredClone(reviewed)
    change(payload.document)
    assert.throws(() => validatePayload(payload))
  }
})

test('wrong source/price and misleading photo cannot enter the import', () => {
  const wrongPrice = structuredClone(reviewed)
  wrongPrice.document.priceAmount = 195000
  assert.throws(() => validatePayload(wrongPrice))
  const neighbour = structuredClone(reviewed)
  neighbour.photos[0].sourceUrl = 'https://media.rightmove.co.uk/property-photo/86c05e1f8/93277344/86c05e1f8adda26ecda688214b4a7555.jpeg'
  assert.throws(() => validatePayload(neighbour), /Neighbour/)
  const wrongSource = structuredClone(reviewed)
  wrongSource.photos[0].sourceUrl = 'https://example.com/unrelated.jpeg'
  assert.throws(() => validatePayload(wrongSource), /source/)
})

test('existing draft or published match blocks another creation', () => {
  assert.doesNotThrow(() => assertNoExistingMatches([]))
  assert.throws(() => assertNoExistingMatches([{_id: 'drafts.existing'}]), /already exists/)
  assert.throws(() => assertNoExistingMatches([{_id: 'existing'}]), /already exists/)
})
