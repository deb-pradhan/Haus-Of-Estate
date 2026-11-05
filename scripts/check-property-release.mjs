#!/usr/bin/env node
/** Read-only CMS preflight. Never creates, imports, publishes or uploads anything. */
import { pathToFileURL } from 'node:url'

export const RELEASE_PROPERTIES = Object.freeze([
  { id: '9405e5db-9b61-4fd7-bb26-ef4f89eb71c8', slug: 'azizi-florence', type: 'Development', designs: 0 },
  { id: '0f23c71e-459d-4e00-81c3-2dfab801c247', slug: 'azizi-florence-4-bedroom-villas', type: 'Villa', bedrooms: 4, designs: 2 },
  { id: '413a49b8-c0f4-4e11-8e37-2c42095281cb', slug: 'azizi-florence-5-bedroom-villas', type: 'Villa', bedrooms: 5, designs: 2 },
  { id: '5c86a687-3e2f-40d9-aa03-7ff580313158', slug: 'azizi-florence-6-bedroom-villas', type: 'Villa', bedrooms: 6, designs: 3 },
  { id: '08e9b9ea-74ba-4b61-90b5-5ec54a9cfc47', slug: 'azizi-florence-3-bedroom-townhouses', type: 'Townhouse', bedrooms: 3, designs: 5 },
  { id: '09828cf9-b9d5-409f-8e4a-658fcdaa75a6', slug: 'azizi-florence-4-bedroom-townhouses', type: 'Townhouse', bedrooms: 4, designs: 7 },
  { id: 'kore-wellness-residence', slug: 'kore-wellness-residence', type: 'Apartment', designs: 0 },
])

const disputedPlots = new Set(['novoli-4-home-corner', 'novoli-6-home-corner', 'spada-8-home-corner'])
const canonicalId = (id) => id?.replace(/^drafts\./, '')

export function imageReferences(value, refs = new Set()) {
  if (!value || typeof value !== 'object') return refs
  if (typeof value._ref === 'string' && value._ref.startsWith('image-')) refs.add(value._ref)
  for (const child of Object.values(value)) imageReferences(child, refs)
  return refs
}

export function auditPropertyRelease(documents, assets, { expectPublished = false } = {}) {
  const issues = []
  const resolved = new Set(assets.filter((asset) => asset._type === 'sanity.imageAsset' && asset.hasUrl).map((asset) => asset._id))
  const records = RELEASE_PROPERTIES.map((target) => {
    const matching = documents.filter((doc) => canonicalId(doc._id) === target.id)
    const draft = matching.find((doc) => doc._id === `drafts.${target.id}`)
    const published = matching.find((doc) => doc._id === target.id)
    const selected = expectPublished ? published : draft || published
    const duplicates = documents.filter((doc) => doc.slug?.current === target.slug && canonicalId(doc._id) !== target.id)
    if (duplicates.length) issues.push(`${target.slug}: another identity uses this slug (${duplicates.map((doc) => doc._id).join(', ')}).`)
    if (!selected) {
      issues.push(`${target.slug}: ${expectPublished ? 'published document' : 'draft or published document'} is missing. Do not assume an unauthenticated query can see drafts.`)
      return { slug: target.slug, draft: null, published: published ? { id: published._id, revision: published._rev } : null }
    }
    if (selected._type !== 'property' || selected.slug?.current !== target.slug) issues.push(`${target.slug}: identity/type/slug does not match the intended record.`)
    if (!selected._rev) issues.push(`${target.slug}: revision is missing; refresh the CMS read.`)
    if (selected.unitType !== target.type || (target.bedrooms != null && selected.bedrooms !== target.bedrooms)) issues.push(`${target.slug}: home type or bedroom count differs from the prepared listing.`)
    if (expectPublished && selected.status !== 'published') issues.push(`${target.slug}: document exists but website status is not Published.`)
    if (['sold', 'withdrawn', 'archived'].includes(selected.listingState)) issues.push(`${target.slug}: current listing state is ${selected.listingState}; review before publication.`)
    const designs = selected.designVariants || []
    if (designs.length !== target.designs) issues.push(`${target.slug}: expected ${target.designs} designs, received ${designs.length}; review the changed content.`)
    if (target.slug.startsWith('azizi-florence') && !selected.featuredImage?.asset?._ref) issues.push(`${target.slug}: supplied hero asset is missing.`)
    for (const design of designs) {
      if (disputedPlots.has(design._key) && design.plotAreaStatus !== 'conflict') issues.push(`${target.slug}/${design._key}: disputed plot must retain the conflict marker until reconciled.`)
      if (!design.images?.length || !design.floorPlans?.length) issues.push(`${target.slug}/${design._key}: a prepared design image or floor plan is missing.`)
    }
    const missingImages = [...imageReferences(selected)].filter((id) => !resolved.has(id))
    if (missingImages.length) issues.push(`${target.slug}: ${missingImages.length} image asset references do not resolve.`)
    return {
      slug: target.slug,
      draft: draft ? { id: draft._id, revision: draft._rev, status: draft.status } : null,
      published: published ? { id: published._id, revision: published._rev, status: published.status } : null,
      reviewedId: selected._id,
      listingState: selected.listingState ?? null,
      designs: designs.length,
      imageCount: imageReferences(selected).size,
      unresolvedImages: missingImages,
      // Report recorded approvals; never infer or manufacture them.
      recordedApproval: selected.editorialApproval ? {
        contentApproved: selected.editorialApproval.contentApproved ?? null,
        seoApproved: selected.editorialApproval.seoApproved ?? null,
        approvedBy: selected.editorialApproval.approvedBy ?? null,
        approvedAt: selected.editorialApproval.approvedAt ?? null,
      } : null,
    }
  })
  return { checkedAt: new Date().toISOString(), mode: expectPublished ? 'published' : 'pre-publication', issues, records }
}

async function main() {
  const args = process.argv.slice(2)
  if (args.some((arg) => arg !== '--expect-published')) throw new Error('Usage: check-property-release.mjs [--expect-published]')
  const { getCliClient } = await import('sanity/cli')
  const token = process.env.SANITY_API_READ_TOKEN || process.env.SANITY_READ_TOKEN
  const client = getCliClient({
    projectId: 'jdxbkry4', dataset: 'production', apiVersion: '2026-02-01',
    useCdn: false, perspective: 'raw', maxRetries: 0, ...(token ? { token } : {}),
  })
  if (!client.config().token) throw new Error('Authenticated Sanity read access is unavailable. Run through `sanity exec --with-user-token` after signing in, or configure a read token securely. No CMS query or mutation was attempted.')
  const ids = RELEASE_PROPERTIES.flatMap(({ id }) => [id, `drafts.${id}`])
  const slugs = RELEASE_PROPERTIES.map(({ slug }) => slug)
  const documents = await client.fetch(`*[_id in $ids || (_type == "property" && slug.current in $slugs && !(_id in path("versions.**")))]{
    _id, _type, _rev, slug, status, listingState, unitType, bedrooms,
    featuredImage, gallery, floorPlans, designVariants, interiorSchemes, editorialApproval
  }`, { ids, slugs })
  const imageIds = [...imageReferences(documents)]
  const assets = imageIds.length ? await client.fetch('*[_id in $ids]{_id,_type,"hasUrl":defined(url)}', { ids: imageIds }) : []
  const result = auditPropertyRelease(documents, assets, { expectPublished: args.includes('--expect-published') })
  console.log(JSON.stringify({ projectId: 'jdxbkry4', dataset: 'production', authenticated: true, ...result }, null, 2))
  if (result.issues.length) process.exitCode = 1
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1 })
}
