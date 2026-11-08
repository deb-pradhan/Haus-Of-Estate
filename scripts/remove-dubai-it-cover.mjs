// Sonia asked on 5 November 2026 for the "Dubai IT" branded skyline cover to be
// removed from the published article. This removes only that cover reference.
// It does not delete the article, pick a replacement image or delete the asset.
// Read-only unless HAUS_DUBAI_IT_COVER_EXECUTE=true. Run with
// `npx sanity exec scripts/remove-dubai-it-cover.mjs --with-user-token`.
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { getCliClient } from 'sanity/cli'
import { describeRemovalEffect, planCoverRemoval } from './lib/cover-removal-plan.mjs'

const target = {
  id: 'aef74ca4-762a-4e73-ae9e-99d540439167',
  slug: 'from-palm-jumeirah-to-difc-how-rapid-execution-powers-dubai-property-growth',
  // Verified on 8 November 2026: uploaded 5 November as dubai-it-canva-original-2026-11-05.png,
  // alt "Dubai skyline at dusk with Haus of Estate and Dubai IT branding".
  assetId: 'image-d779c361dcdb87ff32a4eb6208c2bbe6be2accd1-1920x1080-png',
}
const ids = [target.id, `drafts.${target.id}`]
const client = getCliClient({ projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw', maxRetries: 0 })
if (!client.config().token) throw new Error('Sanity CLI authentication required (--with-user-token).')

const before = await client.fetch('*[_id in $ids]', { ids })
const protectedBefore = await client.fetch('*[_type in ["property", "post"] && !(_id in $ids)] | order(_id){_id,_rev}', { ids })
const { plans, notes } = planCoverRemoval(target, before)
console.log(JSON.stringify({
  execute: process.env.HAUS_DUBAI_IT_COVER_EXECUTE === 'true',
  target,
  plans,
  notes,
  effect: describeRemovalEffect(target.slug),
  assetStaysInMediaLibrary: 'Delete image-d779c361… separately once nothing references it, if Sonia wants it gone from the media library too.',
}, null, 2))

if (process.env.HAUS_DUBAI_IT_COVER_EXECUTE === 'true') {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const backup = path.join(root, '.git/dubai-it-cover-removal-2026-11-08')
  await mkdir(backup, { recursive: true })
  // Refuse to overwrite an earlier backup; inspect it before any retry.
  await writeFile(path.join(backup, 'before.json'), JSON.stringify({ documents: before, protectedRevisions: protectedBefore }, null, 2), { flag: 'wx' })
  let transaction = client.transaction()
  for (const plan of plans) transaction = transaction.patch(plan.id, (patch) => patch.ifRevisionId(plan.revision).unset(plan.unset))
  const result = await transaction.commit({ visibility: 'sync', returnDocuments: false })
  await writeFile(path.join(backup, 'mutation.json'), JSON.stringify(result, null, 2))

  const after = await client.fetch('*[_id in $ids]', { ids })
  const comparable = (doc, dropKeys) => Object.fromEntries(Object.entries(doc).filter(([key]) => !dropKeys.includes(key)))
  for (const plan of plans) {
    const actual = after.find((doc) => doc._id === plan.id)
    if (!actual || actual.featuredImage !== undefined) throw new Error(`Unexpected read-back: ${plan.id}`)
    const source = before.find((doc) => doc._id === plan.id)
    const expected = comparable(source, ['featuredImage', '_rev', '_updatedAt'])
    if (!isDeepStrictEqual(comparable(actual, ['_rev', '_updatedAt']), expected)) throw new Error(`Other fields changed unexpectedly: ${plan.id}`)
  }
  const protectedAfter = await client.fetch('*[_type in ["property", "post"] && !(_id in $ids)] | order(_id){_id,_rev}', { ids })
  if (!isDeepStrictEqual(protectedBefore, protectedAfter)) throw new Error('Other property/blog revisions changed; inspect before proceeding.')
  const receipt = { verifiedAt: new Date().toISOString(), transactionId: result.transactionId, changedIds: plans.map((plan) => plan.id), otherPropertyAndBlogRevisionsUnchanged: true, documents: after }
  await writeFile(path.join(backup, 'after.json'), JSON.stringify(receipt, null, 2))
  console.log(JSON.stringify({ verifiedAt: receipt.verifiedAt, changedIds: receipt.changedIds, otherPropertyAndBlogRevisionsUnchanged: true }))
}
