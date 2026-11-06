export interface SearchDocument {
  _id: string
  _type: 'property' | 'post'
  slug: string
  title: string
  summary?: string
  community?: string
  city?: string
  country?: string
  developer?: string
  unitType?: string
}

export function normalizeSearchQuery(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] || '' : value || '').replace(/\s+/g, ' ').trim().slice(0, 120)
}

/** Match only the public summary fields projected by SITE_SEARCH_QUERY. */
export function searchPublicSummaries(documents: SearchDocument[], query: string): SearchDocument[] {
  const words = normalizeSearchQuery(query).toLocaleLowerCase('en-GB').split(' ').filter(Boolean)
  if (!words.length) return []
  return documents.filter((document) => {
    if (!['property', 'post'].includes(document._type) || !document.slug || /^(drafts|versions)\./.test(document._id)) return false
    const text = [document.title, document.summary, document.community, document.city,
      document.country, document.developer, document.unitType].filter(Boolean).join(' ').toLocaleLowerCase('en-GB')
    return words.every((word) => text.includes(word))
  })
}
