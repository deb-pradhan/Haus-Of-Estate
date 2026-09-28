import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  mkdtemp, mkdir, readFile, writeFile, stat, realpath, rm, symlink, readdir,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'
import {
  preparePropertyMedia, validateManifest, validateDraft, validateDrafts, parseArgs, UNCONFIRMED_DRAFT_FIELDS,
} from '../../scripts/prepare-property-media.mjs'

const projectRoot = fileURLToPath(new URL('../../', import.meta.url))
const clone = (value) => JSON.parse(JSON.stringify(value))
const digest = (buffer) => createHash('sha256').update(buffer).digest('hex')
const missing = async (filePath) => assert.rejects(stat(filePath), { code: 'ENOENT' })

async function fixture(t) {
  const tempParent = await realpath(tmpdir())
  const root = await realpath(await mkdtemp(path.join(tempParent, 'property-media-a # 25%-')))
  t.after(async () => {
    // Recursive cleanup is restricted to the exact temporary directory created by this test.
    assert.equal(path.dirname(root), tempParent)
    assert.ok(path.basename(root).startsWith('property-media-a # 25%-'))
    await rm(root, { recursive: true, force: true })
  })
  const sourceRoot = path.join(root, 'source')
  const brochureParent = path.join(root, 'brochure')
  await mkdir(sourceRoot)
  await mkdir(brochureParent)
  const hero = await sharp({ create: { width: 3200, height: 1600, channels: 3,
    background: '#628778' } }).jpeg().toBuffer()
  const gallery = await sharp({ create: { width: 150, height: 300, channels: 3,
    background: '#224466' } }).withMetadata({ orientation: 6 })
    .withExif({ IFD0: { Artist: 'Private source artist', ImageDescription: 'Source-only metadata' } })
    .jpeg().toBuffer()
  const brochure = Buffer.from('%PDF-1.7\nSynthetic local brochure fixture\n%%EOF\n')
  await writeFile(path.join(sourceRoot, 'hero.jpg'), hero)
  await writeFile(path.join(sourceRoot, 'gallery.jpg'), gallery)
  await writeFile(path.join(brochureParent, 'brochure.pdf'), brochure)
  const manifest = {
    schemaVersion: 1,
    project: { name: 'Test Project', slug: 'test-project', documentId: 'drafts.property-test-project' },
    sourcePackage: { fileCount: 2, totalBytes: hero.length + gallery.length },
    brochure: { sourcePath: 'brochure.pdf', sha256: digest(brochure), bytes: brochure.length, pageCount: 1 },
    images: [
      { id: 'hero', role: 'hero', galleryOrder: null, sourcePath: 'hero.jpg',
        sha256: digest(hero), bytes: hero.length, width: 3200, height: 1600,
        outputFile: 'hero.jpg', alt: 'Project aerial render', brochurePages: [1], evidenceNotes: [] },
      { id: 'living-room', role: 'gallery', galleryOrder: 1, sourcePath: 'gallery.jpg',
        sha256: digest(gallery), bytes: gallery.length, width: 150, height: 300,
        outputFile: 'living-room.jpg', alt: 'Living room render', brochurePages: [], evidenceNotes: [] },
    ],
  }
  const draft = {
    _id: 'drafts.property-test-project', _type: 'property', title: 'Test Project',
    slug: { _type: 'slug', current: 'test-project' }, status: 'draft', featured: false,
    summary: 'Verified descriptive text retained as supplied.',
    verification: { status: 'unverified', notes: 'Awaiting business review.' },
  }
  const options = {
    manifest: path.join(root, 'manifest.json'), draft: path.join(root, 'draft.ndjson'),
    sourceRoot, brochure: path.join(brochureParent, 'brochure.pdf'),
    output: path.join(root, 'prepared'),
  }
  const save = async () => {
    await writeFile(options.manifest, JSON.stringify(manifest))
    await writeFile(options.draft, JSON.stringify(draft) + '\n')
  }
  await save()
  return { root, sourceRoot, brochureParent, manifest, draft, options, save, hero, gallery, brochure }
}

async function multiFixture(t) {
  const f = await fixture(t)
  f.manifest.schemaVersion = 2
  delete f.manifest.project
  for (const image of f.manifest.images) {
    delete image.role
    delete image.galleryOrder
  }
  // This source is a gallery image in the overview and the hero in five other documents.
  const shared = await sharp({ create: { width: 3600, height: 1800, channels: 3,
    background: '#556688' } }).jpeg().toBuffer()
  await writeFile(path.join(f.sourceRoot, 'gallery.jpg'), shared)
  Object.assign(f.manifest.images[1], { sha256: digest(shared), bytes: shared.length, width: 3600, height: 1800 })
  const detail = await sharp({ create: { width: 3000, height: 1500, channels: 3,
    background: '#887744' } }).jpeg().toBuffer()
  await writeFile(path.join(f.sourceRoot, 'detail.jpg'), detail)
  f.manifest.images.push({ id: 'detail', sourcePath: 'detail.jpg', sha256: digest(detail),
    bytes: detail.length, width: 3000, height: 1500, outputFile: 'detail.jpg',
    alt: 'Architectural detail', brochurePages: [1], evidenceNotes: [] })
  f.manifest.sourcePackage = {
    fileCount: 3, totalBytes: f.manifest.images.reduce((total, image) => total + image.bytes, 0),
  }
  f.manifest.documents = [{
    documentId: f.draft._id, title: f.draft.title, slug: f.draft.slug.current, kind: 'development',
    heroImageId: 'hero', galleryImageIds: ['detail', 'living-room'],
  }]
  f.drafts = [clone(f.draft)]
  for (const [unitType, bedrooms] of [['Villa', 4], ['Villa', 5], ['Villa', 6], ['Townhouse', 3], ['Townhouse', 4]]) {
    const slug = 'test-project-' + bedrooms + '-bedroom-' + (unitType === 'Villa' ? 'villas' : 'townhouses')
    const title = 'Test Project — ' + bedrooms + '-Bedroom ' + (unitType === 'Villa' ? 'Villas' : 'Townhouses')
    const documentId = 'drafts.property-' + slug
    f.manifest.documents.push({ documentId, title, slug, kind: 'home-type',
      confirmedFacts: { unitType, bedrooms, brochurePages: [1] },
      heroImageId: 'living-room', galleryImageIds: ['hero', 'detail'] })
    f.drafts.push({ ...clone(f.draft), _id: documentId, title,
      slug: { _type: 'slug', current: slug }, unitType, bedrooms })
  }
  f.save = async () => {
    await writeFile(f.options.manifest, JSON.stringify(f.manifest))
    await writeFile(f.options.draft, f.drafts.map((draft) => JSON.stringify(draft)).join('\n') + '\n')
  }
  await f.save()
  return f
}

test('successful local preparation resizes, auto-orients, strips metadata and preserves sources', async (t) => {
  const f = await fixture(t)
  const before = {
    hero: await readFile(path.join(f.sourceRoot, 'hero.jpg')),
    gallery: await readFile(path.join(f.sourceRoot, 'gallery.jpg')),
    brochure: await readFile(f.options.brochure), draft: await readFile(f.options.draft),
  }
  const report = await preparePropertyMedia(f.options)
  assert.equal(report.status, 'complete')
  assert.equal(report.generator.sharpVersion, sharp.versions.sharp)
  const prepared = JSON.parse(await readFile(path.join(f.options.output, 'property.staging-draft.ndjson'), 'utf8'))
  const { featuredImage, gallery, ...unchanged } = prepared
  assert.deepEqual(unchanged, f.draft)
  assert.equal(featuredImage._key, 'hero')
  assert.equal(gallery[0]._key, 'living-room')
  for (const [reference, dimensions] of [[featuredImage, [2560, 1280]], [gallery[0], [300, 150]]]) {
    assert.equal(reference._type, 'image')
    assert.ok(reference.alt.length > 0)
    assert.match(reference._sanityAsset, /^image@file:\/\/\//)
    assert.ok(reference._sanityAsset.includes('%23'))
    const filename = fileURLToPath(reference._sanityAsset.slice('image@'.length))
    const metadata = await sharp(filename).metadata()
    assert.equal(metadata.format, 'jpeg')
    assert.equal(metadata.isProgressive, true)
    assert.equal(metadata.space, 'srgb')
    assert.deepEqual([metadata.width, metadata.height], dimensions)
    for (const key of ['exif', 'xmp', 'iptc', 'icc', 'orientation']) assert.equal(metadata[key], undefined)
    const outputEntry = report.images.find((image) => image.id === reference._key).output
    const bytes = await readFile(filename)
    assert.equal(digest(bytes), outputEntry.sha256)
    assert.equal(bytes.length, outputEntry.bytes)
  }
  assert.deepEqual(await readFile(path.join(f.sourceRoot, 'hero.jpg')), before.hero)
  assert.deepEqual(await readFile(path.join(f.sourceRoot, 'gallery.jpg')), before.gallery)
  assert.deepEqual(await readFile(f.options.brochure), before.brochure)
  assert.deepEqual(await readFile(f.options.draft), before.draft)
  assert.deepEqual((await readdir(f.options.output)).sort(),
    ['images', 'preparation-report.json', 'property.staging-draft.ndjson'])
  assert.equal(report.brochure.copied, false)
  for (const field of UNCONFIRMED_DRAFT_FIELDS) assert.equal(Object.hasOwn(prepared, field), false)
})

test('all preflight hashes pass before any output; second image corruption leaves no directory', async (t) => {
  const f = await fixture(t)
  const changed = Buffer.from(f.gallery)
  changed[changed.length - 1] ^= 1
  await writeFile(path.join(f.sourceRoot, 'gallery.jpg'), changed)
  await assert.rejects(preparePropertyMedia(f.options), /SHA256 mismatch/)
  await missing(f.options.output)
})

test('PNG input is converted to a small progressive JPEG without enlarging it', async (t) => {
  const f = await fixture(t)
  const png = await sharp({ create: { width: 40, height: 80, channels: 3,
    background: '#558844' } }).png().toBuffer()
  await writeFile(path.join(f.sourceRoot, 'gallery.png'), png)
  Object.assign(f.manifest.images[1], { sourcePath: 'gallery.png', sha256: digest(png),
    bytes: png.length, width: 40, height: 80 })
  await f.save()
  const report = await preparePropertyMedia(f.options)
  assert.equal(report.images[1].source.format, 'png')
  assert.equal(report.images[1].output.format, 'jpeg')
  assert.deepEqual([report.images[1].output.width, report.images[1].output.height], [40, 80])
  assert.deepEqual(await readFile(path.join(f.sourceRoot, 'gallery.png')), png)
})

test('brochure mismatch and actual source dimension mismatch leave no directory', async (t) => {
  const f = await fixture(t)
  f.manifest.brochure.sha256 = '0'.repeat(64)
  await f.save()
  await assert.rejects(preparePropertyMedia(f.options), /Brochure SHA256 mismatch/)
  await missing(f.options.output)
  f.manifest.brochure.sha256 = digest(f.brochure)
  f.manifest.images[1].width += 1
  await f.save()
  await assert.rejects(preparePropertyMedia(f.options), /dimensions mismatch/)
  await missing(f.options.output)
})

test('manifest rejects traversal, unsafe outputs, duplicates and ambiguous image ordering', async (t) => {
  const f = await fixture(t)
  for (const sourcePath of ['../hero.jpg', '/hero.jpg', 'C:/hero.jpg', 'folder\\hero.jpg', 'a/../hero.jpg']) {
    const manifest = clone(f.manifest)
    manifest.images[0].sourcePath = sourcePath
    assert.throws(() => validateManifest(manifest), /Unsafe sourcePath/)
  }
  for (const outputFile of ['../hero.jpg', '/hero.jpg', 'CON.jpg', 'a:b.jpg', 'hero.png']) {
    const manifest = clone(f.manifest)
    manifest.images[0].outputFile = outputFile
    assert.throws(() => validateManifest(manifest), /Unsafe outputFile/)
  }
  for (const mutate of [
    (m) => { m.images[1].id = m.images[0].id },
    (m) => { m.images[1].outputFile = m.images[0].outputFile },
    (m) => { m.images[1].galleryOrder = 2 },
    (m) => { m.images[1].alt = '   ' },
    (m) => { m.images[0].role = 'gallery'; m.images[0].galleryOrder = 2 },
    (m) => { m.images[1].role = 'hero'; m.images[1].galleryOrder = null },
  ]) {
    const manifest = clone(f.manifest)
    mutate(manifest)
    assert.throws(() => validateManifest(manifest))
  }
})

test('native draft and pending business fields are protected', async (t) => {
  const f = await fixture(t)
  for (const mutate of [
    (d) => { d._id = 'property-test-project' },
    (d) => { d.status = 'published' },
    (d) => { d.featured = true },
    (d) => { d.title = 'Another project' },
    (d) => { d.gallery = [] },
    (d) => { d.verification.status = 'verified' },
    (d) => { d.verification.checkedAt = '2026-09-10T00:00:00Z' },
  ]) {
    const draft = clone(f.draft)
    mutate(draft)
    assert.throws(() => validateDraft(draft, f.manifest))
  }
  for (const field of UNCONFIRMED_DRAFT_FIELDS) {
    assert.throws(() => validateDraft({ ...f.draft, [field]: null }, f.manifest),
      new RegExp('must remain absent: ' + field))
  }
  const florenceManifest = JSON.parse(await readFile(path.join(projectRoot, 'scripts/azizi-florence.media.json'), 'utf8'))
  const florenceDraft = JSON.parse(await readFile(path.join(projectRoot, 'scripts/azizi-florence.staging-draft.ndjson'), 'utf8'))
  assert.doesNotThrow(() => validateDraft(florenceDraft, florenceManifest))
  for (const field of UNCONFIRMED_DRAFT_FIELDS) assert.equal(Object.hasOwn(florenceDraft, field), false)
})

test('occupied output and output inside either original-source directory are refused', async (t) => {
  const f = await fixture(t)
  await mkdir(f.options.output)
  const marker = path.join(f.options.output, 'keep.txt')
  await writeFile(marker, 'Do not overwrite')
  await assert.rejects(preparePropertyMedia(f.options), /already exists/)
  assert.equal(await readFile(marker, 'utf8'), 'Do not overwrite')
  for (const parent of [f.sourceRoot, f.brochureParent]) {
    const output = path.join(parent, 'unsafe-output')
    await assert.rejects(preparePropertyMedia({ ...f.options, output }), /must be outside/)
    await missing(output)
  }
})

test('Git checkout, worktree .git file, and bare repository ancestors are rejected', async (t) => {
  const f = await fixture(t)
  for (const kind of ['checkout', 'worktree', 'bare']) {
    const repo = path.join(f.root, kind)
    await mkdir(repo)
    if (kind === 'checkout') await mkdir(path.join(repo, '.git'))
    else if (kind === 'worktree') await writeFile(path.join(repo, '.git'), 'gitdir: elsewhere')
    else {
      await writeFile(path.join(repo, 'HEAD'), 'ref: refs/heads/main')
      await writeFile(path.join(repo, 'config'), '[core]\nbare = true')
      await mkdir(path.join(repo, 'refs'))
      await mkdir(path.join(repo, 'objects'))
    }
    const output = path.join(repo, 'prepared')
    await assert.rejects(preparePropertyMedia({ ...f.options, output }), /Git repositories|bare Git/)
    await missing(output)
  }
})

test('source and output junction/symlink escapes are rejected after realpath resolution', async (t) => {
  const f = await fixture(t)
  const external = path.join(f.root, 'external')
  await mkdir(external)
  await writeFile(path.join(external, 'gallery.jpg'), f.gallery)
  const sourceAlias = path.join(f.sourceRoot, 'alias')
  await symlink(external, sourceAlias, process.platform === 'win32' ? 'junction' : 'dir')
  f.manifest.images[1].sourcePath = 'alias/gallery.jpg'
  await f.save()
  await assert.rejects(preparePropertyMedia(f.options), /escapes source root/)
  await missing(f.options.output)
  f.manifest.images[1].sourcePath = 'gallery.jpg'
  await f.save()
  const alias = path.join(f.root, 'source-alias')
  await symlink(f.sourceRoot, alias, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(preparePropertyMedia({ ...f.options, output: path.join(alias, 'prepared') }),
    /outside the source root/)
  const repo = path.join(f.root, 'repo')
  await mkdir(repo)
  await writeFile(path.join(repo, '.git'), 'gitdir: elsewhere')
  const repoAlias = path.join(f.root, 'repo-alias')
  await symlink(repo, repoAlias, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(preparePropertyMedia({ ...f.options, output: path.join(repoAlias, 'prepared') }),
    /Git repositories/)
  // Also reject a path lexically in Git whose junction points to an external destination.
  const outwardAlias = path.join(repo, 'outward')
  await symlink(external, outwardAlias, process.platform === 'win32' ? 'junction' : 'dir')
  await assert.rejects(preparePropertyMedia({ ...f.options, output: path.join(outwardAlias, 'prepared') }),
    /Git repositories/)
})

test('conversion failure leaves an explicitly incomplete report and no ready NDJSON', async (t) => {
  const f = await fixture(t)
  const raw = Buffer.alloc(512 * 512 * 3)
  for (let index = 0; index < raw.length; index++) raw[index] = (index * 73 + Math.floor(index / 51)) % 256
  const jpeg = await sharp(raw, { raw: { width: 512, height: 512, channels: 3 } }).jpeg().toBuffer()
  const truncated = jpeg.subarray(0, Math.floor(jpeg.length / 2))
  const metadata = await sharp(truncated).metadata() // valid header; invalid compressed body
  await writeFile(path.join(f.sourceRoot, 'gallery.jpg'), truncated)
  Object.assign(f.manifest.images[1], { sha256: digest(truncated), bytes: truncated.length,
    width: metadata.width, height: metadata.height })
  await f.save()
  await assert.rejects(preparePropertyMedia(f.options), /output is incomplete/)
  const report = JSON.parse(await readFile(path.join(f.options.output, 'preparation-report.json'), 'utf8'))
  assert.equal(report.status, 'incomplete')
  assert.equal(report.images.length, 1)
  assert.ok(report.error)
  await missing(path.join(f.options.output, 'property.staging-draft.ndjson'))
})

test('a brochure file symlink protects both the supplied directory and its target directory', async (t) => {
  const f = await fixture(t)
  const aliasParent = path.join(f.root, 'brochure-alias-directory')
  await mkdir(aliasParent)
  const alias = path.join(aliasParent, 'brochure.pdf')
  try {
    await symlink(f.options.brochure, alias, 'file')
  } catch (error) {
    if (process.platform === 'win32' && error.code === 'EPERM') {
      t.skip('File symlink creation requires Windows Developer Mode or symlink privilege.')
      return
    }
    throw error
  }
  for (const parent of [aliasParent, f.brochureParent]) {
    const output = path.join(parent, 'unsafe')
    await assert.rejects(preparePropertyMedia({ ...f.options, brochure: alias, output }),
      /outside the brochure directory/)
    await missing(output)
  }
})

test('CLI help and argument validation require explicit local paths', async () => {
  assert.deepEqual(parseArgs(['--help']), { help: true })
  assert.throws(() => parseArgs([]), /Required option/)
  assert.throws(() => parseArgs(['--unknown', 'x']), /Unknown/)
  const help = spawnSync(process.execPath, [path.join(projectRoot, 'scripts/prepare-property-media.mjs'), '--help'],
    { encoding: 'utf8' })
  assert.equal(help.status, 0, help.stderr)
  assert.match(help.stdout, /No upload, publication, database access/)
})

test('V2 prepares six native drafts, reuses shared images and honours each document gallery order', async (t) => {
  const f = await multiFixture(t)
  const sourceHashes = await Promise.all(f.manifest.images.map(async (image) =>
    digest(await readFile(path.join(f.sourceRoot, image.sourcePath)))))
  f.drafts.reverse() // Input order must not change the authoritative output order.
  await f.save()
  const report = await preparePropertyMedia(f.options)
  assert.equal(report.schemaVersion, 2)
  assert.deepEqual(report.documents, f.manifest.documents)
  assert.equal(report.images.length, 3)
  assert.equal((await readdir(path.join(f.options.output, 'images'))).length, 3)
  assert.equal(report.totalSourceBytes, f.manifest.sourcePackage.totalBytes)
  const prepared = (await readFile(path.join(f.options.output, 'properties.staging-draft.ndjson'), 'utf8'))
    .trim().split('\n').map((line) => JSON.parse(line))
  assert.deepEqual(prepared.map((draft) => draft._id), f.manifest.documents.map((document) => document.documentId))
  for (const [index, draft] of prepared.entries()) {
    const definition = f.manifest.documents[index]
    assert.equal(draft.featuredImage._key, definition.heroImageId)
    assert.deepEqual(draft.gallery.map((image) => image._key), definition.galleryImageIds)
    const { featuredImage, gallery, ...preserved } = draft
    assert.deepEqual(preserved, f.drafts.find((input) => input._id === draft._id))
    assert.ok(featuredImage._sanityAsset.startsWith('image@file:///'))
    assert.ok(gallery.every((image) => image._sanityAsset.startsWith('image@file:///')))
    for (const field of UNCONFIRMED_DRAFT_FIELDS.filter((field) => !['unitType', 'bedrooms'].includes(field))) {
      assert.equal(Object.hasOwn(draft, field), false)
    }
  }
  assert.equal(prepared[0].unitType, undefined)
  assert.equal(prepared[0].bedrooms, undefined)
  assert.equal(prepared[0].gallery[1]._sanityAsset, prepared[1].featuredImage._sanityAsset)
  assert.deepEqual(report.images.map((image) => [image.id, image.output.width, image.output.height]), [
    ['hero', 2560, 1280], ['living-room', 2560, 1280], ['detail', 2000, 1000],
  ])
  const afterHashes = await Promise.all(f.manifest.images.map(async (image) =>
    digest(await readFile(path.join(f.sourceRoot, image.sourcePath)))))
  assert.deepEqual(afterHashes, sourceHashes)
  await missing(path.join(f.options.output, 'property.staging-draft.ndjson'))
  await missing(path.join(f.options.output, 'properties.staging-draft.ndjson.incomplete'))
})

test('V2 refuses missing, extra, duplicate or unexpected documents before producing output', async (t) => {
  const f = await multiFixture(t)
  const originals = clone(f.drafts)
  for (const mutate of [
    (drafts) => drafts.pop(),
    (drafts) => drafts.push(clone(drafts[1])),
    (drafts) => { drafts[2] = clone(drafts[1]) },
    (drafts) => { drafts[1]._id = 'drafts.unexpected-property' },
    (drafts) => { drafts[1].title = 'An incorrect title' },
    (drafts) => { drafts[1].slug.current = 'an-incorrect-slug' },
  ]) {
    f.drafts = clone(originals)
    mutate(f.drafts)
    await f.save()
    await assert.rejects(preparePropertyMedia(f.options), /manifest|Duplicate draft|must match/)
    await missing(f.options.output)
  }
})

test('V2 only accepts the exact evidenced unit type and bedrooms; all other release guards remain', async (t) => {
  const f = await multiFixture(t)
  for (const mutate of [
    (draft) => { draft.unitType = 'Townhouse' },
    (draft) => { draft.bedrooms = 5 },
    (draft) => { draft.bedrooms = '4' },
    (draft) => { delete draft.unitType },
    (draft) => { delete draft.bedrooms },
  ]) {
    const draft = clone(f.drafts[1])
    mutate(draft)
    assert.throws(() => validateDraft(draft, f.manifest), /exactly match confirmedFacts/)
  }
  for (const field of UNCONFIRMED_DRAFT_FIELDS.filter((field) => !['unitType', 'bedrooms'].includes(field))) {
    assert.throws(() => validateDraft({ ...f.drafts[1], [field]: null }, f.manifest),
      /must remain absent/)
  }
  for (const field of ['unitType', 'bedrooms']) {
    assert.throws(() => validateDraft({ ...f.drafts[0], [field]: f.drafts[1][field] }, f.manifest),
      /must remain absent/)
  }
  const noFacts = clone(f.manifest)
  delete noFacts.documents[1].confirmedFacts
  assert.throws(() => validateDraft(f.drafts[1], noFacts), /must remain absent/)
  for (const mutate of [
    (draft) => { draft.status = 'published' },
    (draft) => { draft.featured = true },
    (draft) => { delete draft.verification },
    (draft) => { draft.verification.status = 'verified' },
    (draft) => { draft.verification.checkedAt = '2026-09-10T00:00:00Z' },
  ]) {
    const drafts = clone(f.drafts)
    mutate(drafts[1])
    assert.throws(() => validateDrafts(drafts, f.manifest), /remain|verification/)
  }
})

test('the actual Florence six-document input keeps only confirmed home-type facts and preserves its overview', async () => {
  const manifest = validateManifest(JSON.parse(await readFile(
    path.join(projectRoot, 'scripts/azizi-florence.postings.media.json'), 'utf8')))
  const inputs = (await readFile(path.join(projectRoot, 'scripts/azizi-florence.postings.ndjson'), 'utf8'))
    .trim().split(/\r?\n/).map((line) => JSON.parse(line))
  const drafts = validateDrafts(inputs, manifest)
  assert.equal(manifest.schemaVersion, 2)
  assert.equal(drafts.length, 6)
  const original = JSON.parse(await readFile(
    path.join(projectRoot, 'scripts/azizi-florence.staging-draft.ndjson'), 'utf8'))
  assert.deepEqual(drafts[0], original)
  assert.deepEqual(drafts.slice(1).map((draft) => [draft.unitType, draft.bedrooms]),
    [['Villa', 4], ['Villa', 5], ['Villa', 6], ['Townhouse', 3], ['Townhouse', 4]])
  for (const [index, draft] of drafts.entries()) {
    for (const field of UNCONFIRMED_DRAFT_FIELDS) {
      if (index > 0 && ['unitType', 'bedrooms', 'priceDisplay', 'priceAmount', 'priceCurrency'].includes(field)) continue
      assert.equal(Object.hasOwn(draft, field), false, draft._id + ': ' + field)
    }
  }
})

test('V2 manifest rejects invalid evidence, duplicate identities and ambiguous image assignments', async (t) => {
  const f = await multiFixture(t)
  const mutations = [
    (m) => { m.documents[1].documentId = m.documents[0].documentId },
    (m) => { m.documents[1].slug = m.documents[0].slug },
    (m) => { m.documents[1].heroImageId = 'unknown' },
    (m) => { m.documents[1].galleryImageIds = ['unknown'] },
    (m) => { m.documents[1].galleryImageIds = ['hero', 'hero'] },
    (m) => { m.documents[1].galleryImageIds = ['living-room'] },
    (m) => { m.documents[1].confirmedFacts.bedrooms = '4' },
    (m) => { m.documents[1].confirmedFacts.unitType = 'Apartment' },
    (m) => { m.documents[1].confirmedFacts.brochurePages = [] },
    (m) => { m.documents[1].confirmedFacts.brochurePages = [2] },
    (m) => { m.documents[1].confirmedFacts.priceAmount = 100 },
    (m) => { m.documents[0].confirmedFacts = clone(m.documents[1].confirmedFacts) },
    (m) => { m.images[0].role = 'hero' },
    (m) => { m.images[1].sourcePath = m.images[0].sourcePath },
  ]
  for (const mutate of mutations) {
    const manifest = clone(f.manifest)
    mutate(manifest)
    assert.throws(() => validateManifest(manifest))
  }
  const tooMany = clone(f.manifest)
  tooMany.documents[1].galleryImageIds = []
  for (let index = 0; index < 7; index++) {
    const id = 'extra-' + index
    tooMany.images.push({ ...clone(tooMany.images[2]), id, sourcePath: id + '.jpg', outputFile: id + '.jpg' })
    tooMany.documents[1].galleryImageIds.push(id)
  }
  assert.throws(() => validateManifest(tooMany), /at most six/)
})

test('V2 failed conversion records the affected set and never exposes a ready multi-document file', async (t) => {
  const f = await multiFixture(t)
  const raw = Buffer.alloc(512 * 512 * 3)
  for (let index = 0; index < raw.length; index++) raw[index] = (index * 73 + Math.floor(index / 51)) % 256
  const jpeg = await sharp(raw, { raw: { width: 512, height: 512, channels: 3 } }).jpeg().toBuffer()
  const truncated = jpeg.subarray(0, Math.floor(jpeg.length / 2))
  const metadata = await sharp(truncated).metadata()
  await writeFile(path.join(f.sourceRoot, 'detail.jpg'), truncated)
  Object.assign(f.manifest.images[2], { sha256: digest(truncated), bytes: truncated.length,
    width: metadata.width, height: metadata.height })
  await f.save()
  await assert.rejects(preparePropertyMedia(f.options), /output is incomplete/)
  const report = JSON.parse(await readFile(path.join(f.options.output, 'preparation-report.json'), 'utf8'))
  assert.equal(report.schemaVersion, 2)
  assert.equal(report.status, 'incomplete')
  assert.equal(report.documents.length, 6)
  assert.equal(report.images.length, 2)
  await missing(path.join(f.options.output, 'properties.staging-draft.ndjson'))
  await missing(path.join(f.options.output, 'property.staging-draft.ndjson'))
})


test('Florence prices require exact supplied ranges, currency and cluster scope', async () => {
  const manifest = JSON.parse(await readFile(path.join(projectRoot, 'scripts/azizi-florence.postings.media.json'), 'utf8'))
  const drafts = (await readFile(path.join(projectRoot, 'scripts/azizi-florence.postings.ndjson'), 'utf8')).trim().split(/\r?\n/).map(JSON.parse)
  validateManifest(manifest)
  validateDrafts(drafts, manifest)
  assert.deepEqual(drafts.slice(1).map((d) => d.priceAmount), [3350000, 4200000, 4950000, 1890000, 2260000])
  assert.deepEqual(manifest.documents.slice(1).map((d) => d.confirmedPricing.maximumPrice), [5115000, 6404000, 8205000, 3017000, 3418000])
  for (const field of ['priceAmount', 'priceCurrency', 'priceDisplay']) {
    const altered = structuredClone(drafts[1]); altered[field] = field === 'priceAmount' ? 1 : 'wrong'
    assert.throws(() => validateDraft(altered, manifest), /exactly match supplied evidence/)
  }
  for (const edit of [p => { delete p.currency }, p => { p.maximumPrice = 1 }, p => { p.scope = 'All clusters' }]) {
    const altered = structuredClone(manifest); edit(altered.documents[1].confirmedPricing)
    assert.throws(() => validateManifest(altered), /pricing evidence/)
  }
})
