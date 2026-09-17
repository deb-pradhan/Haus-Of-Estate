// Surya confirmed these two listings on 17 September 2026.
// Read-only by default. HAUS_OFF_PLAN_EXECUTE=true changes native drafts only.
// Run using Sanity CLI exec --with-user-token.
import { mkdir, writeFile } from 'node:fs/promises'
import { isDeepStrictEqual } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getCliClient } from 'sanity/cli'

const targets = [
  { id: 'property-al-furjan', slug: 'al-furjan' },
  { id: 'property-monaco-mansions', slug: 'monaco-mansions' },
]
const client = getCliClient({ projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw' })
if (!client.config().token) throw new Error('Use Sanity CLI exec --with-user-token.')
const ids = targets.flatMap(({ id }) => [id, `drafts.${id}`])
const before = await client.fetch('*[_id in $ids]', { ids })
function fixText(value) {
  return value.replaceAll('Completed and off-plan', 'Off-plan').replaceAll('completed and off-plan', 'off-plan')
}
const plans = targets.map(target => {
  const published = before.find(doc => doc._id === target.id)
  const draft = before.find(doc => doc._id === `drafts.${target.id}`)
  const source = draft || published
  if (!published || source?._type !== 'property' || source.slug?.current !== target.slug) throw new Error(`Wrong property: ${target.slug}`)
  if (source.completionStatus !== 'completed-offplan') throw new Error(`Status changed since review: ${target.slug}`)
  const summary = fixText(source.summary)
  const description = source.description?.map(block => ({
    ...block,
    ...(Array.isArray(block.children) ? { children: block.children.map(child => typeof child.text === 'string' ? { ...child, text: fixText(child.text) } : child) } : {}),
  }))
  const changes = { completionStatus: 'off-plan', availability: ['off-plan'], listingType: ['sale'], summary }
  if (description) changes.description = description
  if (summary.length > 280) throw new Error('Summary exceeds schema limit.')
  return { target, published, draft, source, changes }
})
console.log(JSON.stringify(plans.map(({ target, changes }) => ({ ...target, ...changes, description: undefined })), null, 2))
if (process.env.HAUS_OFF_PLAN_EXECUTE === 'true') {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
  const backup = path.join(root, '.git/off-plan-corrections-2026-09-17')
  await mkdir(backup, { recursive: true })
  await writeFile(path.join(backup, 'before.json'), JSON.stringify(before, null, 2), { flag: 'wx' })
  let transaction = client.transaction()
  for (const { target, draft, source, changes } of plans) {
    const draftId = `drafts.${target.id}`
    if (draft) transaction = transaction.patch(draftId, patch => patch.ifRevisionId(draft._rev).set(changes))
    else {
      const { _id, _rev, _createdAt, _updatedAt, ...fields } = source
      transaction = transaction.create({ ...fields, ...changes, _id: draftId })
    }
  }
  await transaction.commit()
  const after = await client.fetch('*[_id in $ids]', { ids })
  const unrelated = ({ _id, _rev, _createdAt, _updatedAt, completionStatus, availability, listingType, summary, description, ...rest }) => rest
  for (const { target, source, published, changes } of plans) {
    const publicAfter = after.find(doc => doc._id === target.id)
    const draftAfter = after.find(doc => doc._id === `drafts.${target.id}`)
    if (!isDeepStrictEqual(published, publicAfter)) throw new Error(`Published record changed: ${target.slug}`)
    if (!isDeepStrictEqual(unrelated(source), unrelated(draftAfter))) throw new Error(`Unrelated fields changed: ${target.slug}`)
    for (const [key, expected] of Object.entries(changes)) {
      if (!isDeepStrictEqual(draftAfter[key], expected)) throw new Error(`Draft verification failed for ${target.slug}: ${key}`)
    }
  }
  await writeFile(path.join(backup, 'after.json'), JSON.stringify(after, null, 2))
  console.log('Verified two off-plan drafts, corrected copy and sale filters; published records unchanged.')
}
