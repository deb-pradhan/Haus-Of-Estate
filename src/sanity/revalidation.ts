export type SanityWebhookDocument = {
  _id?: unknown
  _type?: unknown
  slug?: unknown
  previousSlug?: unknown
}

export type RevalidationPath = {
  path: string
  type?: 'layout' | 'page'
}

export type RevalidationTargets = {
  documentType: SupportedDocumentType
  paths: RevalidationPath[]
  tags: string[]
}

type SupportedDocumentType =
  | 'author'
  | 'category'
  | 'cultureMoment'
  | 'faq'
  | 'post'
  | 'property'
  | 'role'
  | 'teamMember'
  | 'testimonial'

const SLUG_PATTERN = /^[a-z0-9][a-z0-9_-]{0,95}$/i
const DOCUMENT_ID_PATTERN = /^[a-z0-9][a-z0-9._-]{0,127}$/i

const isSupportedDocumentType = (
  value: unknown,
): value is SupportedDocumentType =>
  typeof value === 'string' &&
  [
    'author',
    'category',
    'cultureMoment',
    'faq',
    'post',
    'property',
    'role',
    'teamMember',
    'testimonial',
  ].includes(value)

const readSlug = (value: unknown): string | null => {
  const candidate =
    typeof value === 'string'
      ? value
      : value && typeof value === 'object' && 'current' in value
        ? (value as { current?: unknown }).current
        : null

  return typeof candidate === 'string' && SLUG_PATTERN.test(candidate)
    ? candidate
    : null
}

const readDocumentId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null

  const publishedId = value.startsWith('drafts.')
    ? value.slice('drafts.'.length)
    : value

  return DOCUMENT_ID_PATTERN.test(publishedId) ? publishedId : null
}

const uniquePaths = (paths: RevalidationPath[]): RevalidationPath[] => {
  const seen = new Set<string>()

  return paths.filter(({ path, type }) => {
    const key = `${path}:${type ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const detailPaths = (
  basePath: '/blog' | '/careers' | '/properties',
  currentSlug: string | null,
  previousSlug: string | null,
): RevalidationPath[] =>
  [currentSlug, previousSlug]
    .filter((slug): slug is string => Boolean(slug))
    .map((slug) => ({ path: `${basePath}/${slug}` }))

/**
 * Maps a projected Sanity webhook document to a bounded set of public routes.
 * Unknown document types and unsafe slugs are rejected rather than interpreted
 * as paths supplied by the caller.
 */
export const getSanityRevalidationTargets = (
  document: SanityWebhookDocument | null,
): RevalidationTargets | null => {
  if (!document || !isSupportedDocumentType(document._type)) return null

  const documentType = document._type
  const currentSlug = readSlug(document.slug)
  const previousSlug = readSlug(document.previousSlug)
  const documentId = readDocumentId(document._id)
  const paths: RevalidationPath[] = []

  switch (documentType) {
    case 'property':
      paths.push(
        { path: '/' },
        { path: '/properties' },
        { path: '/properties/residential' },
        { path: '/properties/commercial' },
        { path: '/sitemap.xml' },
        ...detailPaths('/properties', currentSlug, previousSlug),
      )
      break
    case 'post':
      paths.push(
        { path: '/' },
        { path: '/blog' },
        { path: '/sitemap.xml' },
        ...detailPaths('/blog', currentSlug, previousSlug),
      )
      break
    case 'role':
      paths.push(
        { path: '/careers' },
        { path: '/sitemap.xml' },
        ...detailPaths('/careers', currentSlug, previousSlug),
      )
      break
    case 'author':
    case 'category':
      paths.push(
        { path: '/blog' },
        { path: '/blog/[slug]', type: 'page' },
      )
      break
    case 'faq':
      paths.push({ path: '/' }, { path: '/faq' })
      break
    case 'teamMember':
      paths.push({ path: '/' }, { path: '/team' })
      break
    case 'testimonial':
      paths.push({ path: '/' })
      break
    case 'cultureMoment':
      paths.push({ path: '/careers' })
      break
  }

  return {
    documentType,
    paths: uniquePaths(paths),
    tags: [
      'sanity',
      `sanity:${documentType}`,
      ...(documentId ? [`sanity:${documentType}:${documentId}`] : []),
    ],
  }
}
