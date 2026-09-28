// Explicit 21 September instruction: correct these two public listings only.
// Run with Sanity CLI exec --with-user-token. Read-only unless
// HAUS_PUBLIC_OFF_PLAN_EXECUTE=true. Never publishes an entire native draft.
import {mkdir, writeFile} from 'node:fs/promises'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {isDeepStrictEqual} from 'node:util'
import {getCliClient} from 'sanity/cli'

const targets = [
  {id: 'property-al-furjan', slug: 'al-furjan'},
  {id: 'property-monaco-mansions', slug: 'monaco-mansions'},
]
const ids = targets.flatMap(({id}) => [id, `drafts.${id}`])
const client = getCliClient({projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2025-02-19', useCdn: false, perspective: 'raw', maxRetries: 0})
if (!client.config().token) throw new Error('Sanity CLI authentication required.')
const before = await client.fetch('*[_id in $ids]', {ids})
const protectedBefore = await client.fetch('*[_type in ["property", "post"] && !(_id in $ids)] | order(_id){_id,_rev}', {ids})
const stripSystem = doc => Object.fromEntries(Object.entries(doc).filter(([key]) => !['_rev', '_updatedAt'].includes(key)))
const fixText = value => value.replaceAll('Completed and off-plan', 'Off-plan').replaceAll('completed and off-plan', 'off-plan').replaceAll('Completed & off-plan', 'Off-plan').replaceAll('completed & off-plan', 'off-plan')

const plans = []
for (const target of targets) {
  const published = before.find(doc => doc._id === target.id)
  if (!published || published.status !== 'published') throw new Error(`Expected existing published property: ${target.id}`)
  for (const id of [target.id, `drafts.${target.id}`]) {
    const source = before.find(doc => doc._id === id)
    if (!source) continue
    if (source._type !== 'property' || source.slug?.current !== target.slug || !['completed-offplan', 'off-plan'].includes(source.completionStatus)) {
      throw new Error(`Unexpected identity/status; inspect before proceeding: ${id}`)
    }
    if (typeof source.summary !== 'string' || !Array.isArray(source.description)) throw new Error(`Unexpected copy format: ${id}`)
    const desired = {
      completionStatus: 'off-plan',
      availability: ['off-plan'],
      listingType: ['sale'],
      summary: fixText(source.summary),
      description: source.description.map(block => ({
        ...block,
        ...(Array.isArray(block.children) ? {children: block.children.map(child => typeof child.text === 'string' ? {...child, text: fixText(child.text)} : child)} : {}),
      })),
    }
    if (/\bcompleted\b/i.test(JSON.stringify([desired.summary, desired.description]))) throw new Error(`Unexpected remaining completed claim: ${id}`)
    const changes = Object.fromEntries(Object.entries(desired).filter(([key, value]) => !isDeepStrictEqual(source[key], value)))
    plans.push({source, changes})
  }
}
console.log(JSON.stringify(plans.map(({source, changes}) => ({id: source._id, slug: source.slug.current, changedFields: Object.keys(changes), completionStatus: changes.completionStatus || source.completionStatus})), null, 2))
if (process.env.HAUS_PUBLIC_OFF_PLAN_EXECUTE === 'true') {
  const pending = plans.filter(({changes}) => Object.keys(changes).length)
  if (pending.length === 0) {
    console.log('Both published listings and existing drafts are already off-plan; no mutation required.')
  } else {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
    const backup = path.join(root, '.git/off-plan-public-correction-2026-09-21')
    await mkdir(backup, {recursive: true})
    await writeFile(path.join(backup, 'before.json'), JSON.stringify({documents: before, protectedRevisions: protectedBefore}, null, 2), {flag: 'wx'})
    await writeFile(path.join(backup, 'plan.json'), JSON.stringify(pending.map(({source, changes}) => ({id: source._id, revision: source._rev, changes})), null, 2), {flag: 'wx'})
    let transaction = client.transaction()
    for (const {source, changes} of pending) transaction = transaction.patch(source._id, patch => patch.ifRevisionId(source._rev).set(changes))
    const result = await transaction.commit({visibility: 'sync', returnDocuments: false})
    await writeFile(path.join(backup, 'mutation.json'), JSON.stringify(result, null, 2))
    const after = await client.fetch('*[_id in $ids]', {ids})
    for (const {source, changes} of plans) {
      const actual = after.find(doc => doc._id === source._id)
      if (!actual || !isDeepStrictEqual(stripSystem(actual), stripSystem({...source, ...changes}))) throw new Error(`Unexpected read-back: ${source._id}`)
      if (Object.keys(changes).length === 0 && actual._rev !== source._rev) throw new Error(`Unchanged draft revision moved: ${source._id}`)
    }
    const protectedAfter = await client.fetch('*[_type in ["property", "post"] && !(_id in $ids)] | order(_id){_id,_rev}', {ids})
    if (!isDeepStrictEqual(protectedBefore, protectedAfter)) throw new Error('Other property/blog revisions changed; inspect before proceeding.')
    const receipt = {verifiedAt: new Date().toISOString(), transactionId: result.transactionId, changedIds: pending.map(({source}) => source._id), protectedDocumentCount: protectedAfter.length, otherPropertyAndBlogRevisionsUnchanged: true, documents: after}
    await writeFile(path.join(backup, 'after.json'), JSON.stringify(receipt, null, 2))
    console.log(JSON.stringify({verifiedAt: receipt.verifiedAt, changedIds: receipt.changedIds, protectedDocumentCount: receipt.protectedDocumentCount, otherPropertyAndBlogRevisionsUnchanged: true}))
  }
}
