// Review-only by default. Run with Sanity CLI exec --with-user-token.
// HAUS_BLOG_COVER_SOURCE must name the folder containing the reviewed originals.
// HAUS_BLOG_COVER_EXECUTE=true uploads assets and changes native drafts only.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import { getCliClient } from 'sanity/cli'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const source = process.env.HAUS_BLOG_COVER_SOURCE
if (!source || !path.isAbsolute(source)) throw new Error('Set HAUS_BLOG_COVER_SOURCE to the reviewed image folder.')
const execute = process.env.HAUS_BLOG_COVER_EXECUTE === 'true'
const entries = JSON.parse(await readFile(path.join(root, 'scripts/data/blog-covers-2026-09-16.json'), 'utf8'))
const client = getCliClient({ projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw' })
if (!client.config().token) throw new Error('Use Sanity CLI exec --with-user-token.')
const ids = entries.flatMap(entry => [entry.id, `drafts.${entry.id}`])
const docs = await client.fetch('*[_id in $ids]', { ids })
const byId = new Map(docs.map(doc => [doc._id, doc]))
const prepared = []
for (const entry of entries) {
  const published = byId.get(entry.id)
  const draft = byId.get(`drafts.${entry.id}`)
  if (!published || published._type !== 'post' || published.slug?.current !== entry.slug) throw new Error(`Post mismatch: ${entry.slug}`)
  if (published.featuredImage?.asset?._ref !== entry.oldAsset) throw new Error(`Published cover changed since review: ${entry.slug}`)
  const current = draft || published
  if (current.featuredImage?.asset?._ref !== entry.oldAsset) throw new Error(`Draft already has a different cover; inspect before retrying: ${entry.slug}`)
  const bytes = await readFile(path.join(source, entry.filename))
  const metadata = await sharp(bytes).metadata()
  if (metadata.width !== 1920 || metadata.height !== 1080 || metadata.format !== 'jpeg') throw new Error(`Expected reviewed 1920x1080 JPEG: ${entry.filename}`)
  const sha256 = createHash('sha256').update(bytes).digest('hex')
  if (sha256 !== entry.sha256) throw new Error(`Image changed since visual review: ${entry.filename}`)
  prepared.push({ entry, published, draft, bytes, sha256 })
}
console.log(JSON.stringify({ execute, projectId: 'jdxbkry4', dataset: 'production', images: prepared.map(({ entry, bytes, sha256, draft }) => ({ ...entry, bytes: bytes.length, sha256, existingDraft: Boolean(draft) })) }, null, 2))
if (execute) {
  const backup = path.join(root, '.git/blog-cover-update-2026-09-16')
  await mkdir(backup, { recursive: true })
  // Refuse to overwrite the original backup; inspect it before any retry.
  await writeFile(path.join(backup, 'before.json'), JSON.stringify(docs, null, 2), { flag: 'wx' })
  const receipt = []
  for (const item of prepared) {
    const { entry, published, draft, bytes, sha256 } = item
    const asset = await client.assets.upload('image', bytes, { filename: `${entry.slug}.jpg`, contentType: 'image/jpeg' })
    const featuredImage = { _type: 'image', asset: { _type: 'reference', _ref: asset._id }, alt: entry.alt }
    const draftId = `drafts.${entry.id}`
    if (draft) {
      await client.patch(draftId).ifRevisionId(draft._rev).set({ featuredImage }).commit()
    } else {
      const { _id, _rev, _createdAt, _updatedAt, ...fields } = published
      await client.create({ ...fields, _id: draftId, featuredImage })
    }
    receipt.push({ ...entry, draftId, newAsset: asset._id, url: asset.url, sha256, existingDraft: Boolean(draft) })
    await writeFile(path.join(backup, 'receipt.json'), JSON.stringify(receipt, null, 2))
    console.log(`Prepared draft cover: ${entry.slug}`)
  }
  const after = await client.fetch('*[_id in $ids]', { ids })
  for (const item of receipt) {
    const publishedAfter = after.find(doc => doc._id === item.id)
    const draftAfter = after.find(doc => doc._id === item.draftId)
    if (publishedAfter?._rev !== byId.get(item.id)._rev) throw new Error(`Published revision changed; inspect: ${item.slug}`)
    if (draftAfter?.featuredImage?.asset?._ref !== item.newAsset) throw new Error(`Draft verification failed: ${item.slug}`)
    const omitCoverAndSystem = ({ featuredImage, _id, _rev, _createdAt, _updatedAt, ...rest }) => rest
    const original = byId.get(item.draftId) || byId.get(item.id)
    if (JSON.stringify(omitCoverAndSystem(original)) !== JSON.stringify(omitCoverAndSystem(draftAfter))) throw new Error(`Other fields changed; inspect: ${item.slug}`)
  }
  await writeFile(path.join(backup, 'after.json'), JSON.stringify(after, null, 2))
  console.log('Verified: all replacement draft covers saved; published revisions and other draft fields unchanged.')
}
