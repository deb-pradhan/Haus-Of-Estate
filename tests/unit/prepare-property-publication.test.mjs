import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, realpath, writeFile, rm, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import sharp from 'sharp'
import {
  PROJECT, LONDON_SLUG, FLORENCE_IDS, valueHash, sanitizeFields, collectImagePaths,
  readBundle, buildPlan, reviewTemplate, selectReviewedChanges, resolveImages,
  assertSnapshotUnchanged, executeDraftSync, parseArgs, validateOutput,
} from '../../scripts/prepare-property-publication.mjs'

const clone = value => structuredClone(value)
const imagePath = path.resolve(tmpdir(), 'publication-image.jpg')
const image = () => ({ _type: 'image', _key: 'image', alt: 'Prepared exterior',
  _sanityAsset: 'image@' + pathToFileURL(imagePath).href })

function fixture() {
  const london = { _id: 'drafts.property-north-london-three-bedroom', _type: 'property',
    title: 'Three-bedroom terraced house', summary: 'Supplied views and proposed interiors.',
    slug: { _type: 'slug', current: LONDON_SLUG }, community: 'North London', city: 'London', country: 'United Kingdom',
    category: 'residential', unitType: 'Terraced House', bedrooms: 3, priceAmount: 500000,
    priceCurrency: 'GBP', priceDisplay: '£500,000', availability: ['ready'], listingType: ['sale'],
    status: 'draft', featured: false, featuredImage: image(), gallery: [image()], floorPlans: [image()],
    verification: { status: 'unverified', notes: 'Private provenance, not an upload field.' },
  }
  const sources = Object.keys(FLORENCE_IDS).map(slug => ({ _id: `drafts.property-${slug}`,
    _type: 'property', slug: { current: slug }, status: 'draft', featured: false,
    title: 'Historical source title', summary: 'Historical local copy',
    featuredImage: image(), gallery: [image()],
    designVariants: [{ _key: 'type-a', label: 'Type A', sellableAreaSqFt: 3831,
      brochureKey: 'villa-4br', sourceEvidence: 'C:/private/source.pdf', brochureRevision: 'private.pdf',
      images: [image()], floorPlans: [image()] }],
    interiorSchemes: [{ _key: 'palette-a', label: 'Palette A', images: [image()] }],
  }))
  const documents = Object.entries(FLORENCE_IDS).map(([slug, id]) => ({ _id: id, _rev: `rev-${slug}`,
    _type: 'property', slug: { current: slug }, status: 'draft', featured: true,
    title: 'Later CMS title', summary: 'Amenities already exist.', description: [{ text: 'Approved present-tense copy' }],
    featuredImage: { _type: 'image', asset: { _ref: 'image-existing-100x100-jpg' } },
    availability: ['off-plan'], listingType: ['sale'],
    unitType: slug === 'azizi-florence' ? 'Development' : slug.endsWith('villas') ? 'Villa' : 'Townhouse',
    editorialApproval: { contentApproved: true, approvedBy: 'Actual reviewer', approvedAt: '2026-09-14' },
    verification: { status: 'unverified', notes: 'Preserved evidence' },
  }))
  documents.push({ _id: 'existing-public', _rev: 'public-rev', _type: 'property', status: 'published', slug: { current: 'existing' } })
  return { london, sources, snapshot: { ...PROJECT, capturedAt: '2026-10-14', documents },
    bundles: [{ documents: [london], digest: 'london' }, { documents: sources, digest: 'florence' }] }
}

test('Florence plans only designs and palettes; preserves CMS copy, pricing, approvals and identity', () => {
  const f = fixture()
  const plan = buildPlan(f.snapshot, f.bundles)
  for (const doc of plan.documents.filter(doc => !doc.isNew)) {
    assert.equal(doc.id, FLORENCE_IDS[doc.slug])
    assert.deepEqual(doc.changes.map(change => change.field), ['designVariants', 'interiorSchemes'])
    assert.equal(doc.expectedRevision, `rev-${doc.slug}`)
  }
  const fields = sanitizeFields(f.london, true)
  assert.equal(fields.priceAmount, 500000)
  assert.equal(fields.verification, undefined)
  assert.equal(fields.status, undefined)
  assert.equal(fields.editorialApproval, undefined)
})

test('design source filenames/evidence never enter proposed CMS fields; brochure key remains', () => {
  const f = fixture()
  const fields = sanitizeFields(f.sources[0], false)
  assert.equal(fields.designVariants[0].sourceEvidence, undefined)
  assert.equal(fields.designVariants[0].brochureRevision, undefined)
  assert.equal(fields.designVariants[0].brochureKey, 'villa-4br')
  const paths = collectImagePaths(fields)
  assert.equal(paths.size, 1)
  const resolved = resolveImages(fields, new Map([[imagePath, 'image-aabbcc-100x100-jpg']]))
  assert.equal(resolved.designVariants[0].floorPlans[0].asset._ref, 'image-aabbcc-100x100-jpg')
  assert.equal(resolved.interiorSchemes[0].images[0].asset._ref, 'image-aabbcc-100x100-jpg')
  assert.ok(!JSON.stringify(resolved).includes('file:'))
  assert.ok(!JSON.stringify(resolved).includes('private.pdf'))
})

test('rejects duplicate slugs, historical Florence aliases and missing confirmed classification', () => {
  const f = fixture()
  const duplicate = clone(f.snapshot)
  duplicate.documents.push({ ...duplicate.documents[0], _id: 'drafts.duplicate' })
  assert.throws(() => buildPlan(duplicate, f.bundles), /Duplicate native drafts/)
  const alias = clone(f.snapshot)
  alias.documents[0]._id = 'drafts.property-azizi-florence'
  assert.throws(() => buildPlan(alias, f.bundles), /existing Florence UUID/)
  const unclassified = clone(f.snapshot)
  delete unclassified.documents[0].availability
  assert.throws(() => buildPlan(unclassified, f.bundles), /classification first/)
  const wrongLondon = clone(f.bundles)
  wrongLondon[0].documents[0].priceAmount = 999
  assert.throws(() => buildPlan(f.snapshot, wrongLondon), /confirmed details/)
})

test('matching published counterparts are preserved; conflicting identities and London collisions fail', () => {
  const f = fixture()
  const shared = clone(f.snapshot)
  shared.documents.push({ ...shared.documents[0], _id: shared.documents[0]._id.slice(7), _rev: 'pub' })
  assert.equal(buildPlan(shared, f.bundles).documents.length, 7)
  shared.documents.at(-1)._id = 'another-id'
  assert.throws(() => buildPlan(shared, f.bundles), /Conflicting published/)
  const collision = clone(f.snapshot)
  collision.documents.push({ _id: f.london._id, _rev: 'collision', _type: 'property', slug: { current: 'different' } })
  assert.throws(() => buildPlan(collision, f.bundles), /London identity/)
})

test('review is tied to exact source/snapshot, rejects injected fields, allows omitting existing fields', () => {
  const f = fixture()
  const plan = buildPlan(f.snapshot, f.bundles)
  const review = reviewTemplate(plan)
  review.documents[1].fields = []
  assert.deepEqual(selectReviewedChanges(plan, review)[1].fields, {})
  const injected = clone(review)
  injected.documents[1].fields.push({ field: 'editorialApproval', beforeSha256: 'a', afterSha256: 'b' })
  assert.throws(() => selectReviewedChanges(plan, injected), /Reviewed field differs/)
  const tampered = clone(review)
  tampered.documents[0].fields[0].afterSha256 = 'changed'
  assert.throws(() => selectReviewedChanges(plan, tampered), /Reviewed field differs/)
  const incompleteNew = clone(review)
  incompleteNew.documents[0].fields.pop()
  assert.throws(() => selectReviewedChanges(plan, incompleteNew), /every prepared field/)
  const stale = clone(review)
  stale.snapshotSha256 = 'old'
  assert.throws(() => selectReviewedChanges(plan, stale), /preflight/)
})

test('revision drift or newly appearing records reject a stale full snapshot', () => {
  const { snapshot } = fixture()
  const reordered = { ...snapshot, documents: [...snapshot.documents].reverse() }
  assertSnapshotUnchanged(snapshot, reordered)
  const changed = clone(snapshot)
  changed.documents[0]._rev = 'edited'
  assert.throws(() => assertSnapshotUnchanged(snapshot, changed), /changed since/)
  changed.documents.push({ _id: 'new', _type: 'property', _rev: 'new' })
  assert.throws(() => assertSnapshotUnchanged(snapshot, changed), /changed since/)
})

test('synthetic execution patches only reviewed draft fields with revision guards and preserves published docs', async () => {
  const f = fixture()
  const plan = buildPlan(f.snapshot, f.bundles)
  const review = reviewTemplate(plan)
  for (const doc of review.documents.slice(2)) doc.fields = []
  const selected = selectReviewedChanges(plan, review)
  let live = clone(f.snapshot.documents)
  const uploads = [], operations = [], receipts = new Map()
  const transaction = {
    transactionId(id) { assert.match(id, /^[a-f0-9-]+$/); return this },
    create(doc) { operations.push({ create: doc }); return this },
    patch(id, callback) {
      const operation = { id }
      const patch = { ifRevisionId(rev) { operation.rev = rev; return this }, set(fields) { operation.fields = fields; return this } }
      callback(patch); operations.push(operation); return this
    },
    async commit() {
      for (const operation of operations) {
        if (operation.create) live.push({ ...operation.create, _rev: 'created' })
        else {
          const index = live.findIndex(doc => doc._id === operation.id)
          assert.equal(live[index]._rev, operation.rev)
          live[index] = { ...live[index], ...operation.fields, _rev: 'patched' }
        }
      }
      return { transactionId: 'synthetic-transaction' }
    },
  }
  const client = {
    async fetch(query) { assert.equal(query, '*[_type == "property"]'); return clone(live) },
    assets: { async upload(type, bytes) { uploads.push({ type, bytes }); return { _id: 'image-aabbcc-100x100-jpg' } } },
    transaction: () => transaction,
  }
  const result = await executeDraftSync(client, f.snapshot, selected,
    new Map([[imagePath, { filename: imagePath, bytes: Buffer.from('verified synthetic bytes'), sha256: 'synthetic' }]]),
    'test-output', async (name, value) => receipts.set(name, clone(value)))
  assert.equal(result.draftsChanged, 2)
  assert.equal(uploads.length, 1, 'only reachable image paths are uploaded once')
  const changed = live.find(doc => doc._id === FLORENCE_IDS['azizi-florence'])
  const before = f.snapshot.documents[0]
  for (const field of ['title', 'summary', 'description', 'featured', 'editorialApproval', 'verification', 'availability', 'listingType', 'featuredImage']) {
    assert.deepEqual(changed[field], before[field], `${field} must survive`)
  }
  assert.equal(changed.status, 'draft')
  assert.equal(live.find(doc => doc._id === 'existing-public')._rev, 'public-rev')
  const london = live.find(doc => doc._id === f.london._id)
  assert.equal(london.featured, false)
  assert.equal(london.status, 'draft')
  assert.equal(london.publishedAt, undefined)
  assert.equal(london.editorialApproval, undefined)
  assert.deepEqual(london.verification, { status: 'unverified' })
  assert.equal(receipts.get('receipt.json').state, 'verified')
  assert.equal(receipts.get('live-before.json').documents.length, f.snapshot.documents.length)
})

test('execution refuses stale snapshot before any upload or transaction', async () => {
  const f = fixture()
  const changed = clone(f.snapshot.documents)
  changed[0]._rev = 'new-editor-revision'
  const client = { fetch: async () => changed, assets: { upload: () => assert.fail('must not upload') }, transaction: () => assert.fail('must not mutate') }
  await assert.rejects(executeDraftSync(client, f.snapshot, [], new Map(), 'unused', async () => {}), /changed since/)
})

async function temporary(t) {
  const parent = await realpath(tmpdir())
  const root = await realpath(await mkdtemp(path.join(parent, 'haus-publication-test-')))
  t.after(async () => {
    assert.equal(path.dirname(root), parent)
    assert.ok(path.basename(root).startsWith('haus-publication-test-'))
    await rm(root, { recursive: true, force: true })
  })
  return root
}

test('bundle validates all JPEG bytes/dimensions and rejects a tampered floor plan', async t => {
  const root = await temporary(t)
  await mkdir(path.join(root, 'images'))
  const bytes = await sharp({ create: { width: 16, height: 12, channels: 3, background: '#123456' } }).jpeg().toBuffer()
  const digest = createHash('sha256').update(bytes).digest('hex')
  const images = [], refs = []
  for (let index = 0; index < 6; index++) {
    const filename = path.join(root, 'images', `${index}.jpg`)
    await writeFile(filename, bytes)
    images.push({ id: `${index}`, output: { relativePath: `images/${index}.jpg`, bytes: bytes.length, sha256: digest, width: 16, height: 12 } })
    refs.push({ _type: 'image', alt: 'Verified image', _sanityAsset: 'image@' + pathToFileURL(filename).href })
  }
  const { london } = fixture()
  london.featuredImage = { ...refs[0], mediaKind: 'concept-comparison' }
  london.gallery = refs.slice(1, 5)
  london.floorPlans = [refs[5]]
  await writeFile(path.join(root, 'preparation-report.json'), JSON.stringify({ schemaVersion: 3, status: 'complete', images }))
  await writeFile(path.join(root, 'properties.staging-draft.ndjson'), JSON.stringify(london) + '\n')
  const bundle = await readBundle(root, 'london')
  assert.equal(bundle.images.size, 6)
  assert.equal(bundle.documents.length, 1)
  await writeFile(path.join(root, 'images', '5.jpg'), Buffer.from('altered floor plan'))
  await assert.rejects(readBundle(root, 'london'), /integrity failed: 5/)
  assert.equal((await readFile(path.join(root, 'images', '0.jpg'))).length, bytes.length)
})

test('output refuses existing directories, input overlap, and Git worktree marker files', async t => {
  const root = await temporary(t)
  const output = path.join(root, 'fresh')
  assert.equal(await validateOutput(output), output)
  await assert.rejects(validateOutput(root), /already exists/)
  await assert.rejects(validateOutput(output, [root]), /overlap/)
  await writeFile(path.join(root, '.git'), 'gitdir: /some/worktree')
  await assert.rejects(validateOutput(output), /outside Git/)
})

test('CLI defaults to local dry run and requires explicit reviewed execution; no publish flag exists', () => {
  const root = path.resolve(tmpdir(), 'example')
  const args = ['--snapshot', path.join(root, 'snapshot.json'), '--london-bundle', path.join(root, 'london'),
    '--florence-bundle', path.join(root, 'florence'), '--output', path.join(root, 'output')]
  assert.equal(parseArgs(args).execute, false)
  assert.throws(() => parseArgs([...args, '--execute']), /requires an absolute --review/)
  assert.throws(() => parseArgs([...args, '--publish']), /Unknown/)
  assert.equal(parseArgs([...args, '--review', path.join(root, 'review.json'), '--execute']).execute, true)
  assert.equal(valueHash({ b: 2, a: 1 }), valueHash({ a: 1, b: 2 }))
})
