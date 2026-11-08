// Pure planning for removing one post's featured image. No Sanity client here,
// so the rules can be unit-tested; the runner script owns the mutation.

/**
 * @param {object} target { id, slug, assetId }
 * @param {Array<object>} documents raw Sanity documents for `id` and `drafts.<id>`
 * @returns {{ plans: Array<{id, revision, unset: string[]}>, notes: string[] }}
 */
export function planCoverRemoval(target, documents) {
  const published = documents.find((doc) => doc._id === target.id)
  const draft = documents.find((doc) => doc._id === `drafts.${target.id}`)
  if (!published) throw new Error(`Published post not found: ${target.id}`)
  if (published._type !== 'post' || published.slug?.current !== target.slug) {
    throw new Error(`Unexpected post identity; inspect before proceeding: ${target.id}`)
  }
  if (published.status !== 'published') throw new Error(`Expected a published post: ${target.id}`)
  const publishedAsset = published.featuredImage?.asset?._ref
  if (publishedAsset !== target.assetId) {
    throw new Error(`Published cover changed since review (${publishedAsset ?? 'none'}); inspect before proceeding`)
  }

  const plans = [{ id: published._id, revision: published._rev, unset: ['featuredImage'] }]
  const notes = ['The article, its body, SEO fields and status are untouched; only the cover image reference is removed.']

  if (draft) {
    const draftAsset = draft.featuredImage?.asset?._ref
    if (draftAsset === target.assetId) {
      plans.push({ id: draft._id, revision: draft._rev, unset: ['featuredImage'] })
      notes.push('The native draft carries the same cover and is cleared too, so a later publish cannot restore it.')
    } else if (draftAsset) {
      notes.push(`The native draft already has a different cover (${draftAsset}); it is left for editorial review and not changed.`)
    } else {
      notes.push('The native draft has no cover; it is left unchanged.')
    }
  }
  return { plans, notes }
}

/** What the public article shows once the reference is gone, from the renderer's fallback rules. */
export function describeRemovalEffect(slug, fallbackSlugs = []) {
  return fallbackSlugs.includes(slug)
    ? 'The article will show the legacy fallback image for this slug.'
    : 'The article renders without a hero image, the blog cards show an empty image frame, and Open Graph falls back to the site default image.'
}
