import { buildPropertyLocationGroups } from '@/lib/property-locations'
import { isLocalCataloguePreviewEnabled, loadCataloguePreviewGroups } from '@/lib/property-catalogue-preview'
import { sanityFetch } from '@/sanity/live'
import { PROPERTY_LOCATION_OPTIONS_QUERY } from '@/sanity/queries'

interface PropertyLocationRecord {
  country?: string | null
  city?: string | null
}

export async function GET() {
  const localPreview = isLocalCataloguePreviewEnabled()
  const [{ data }, previewGroups] = await Promise.all([
    sanityFetch<PropertyLocationRecord[]>({ query: PROPERTY_LOCATION_OPTIONS_QUERY }),
    localPreview ? loadCataloguePreviewGroups() : Promise.resolve([]),
  ])
  const previewLocations = previewGroups.map(({ overview }) => overview.document)
  const headers: Record<string, string> = localPreview ? {
    'Cache-Control': 'private, no-store, max-age=0',
    'X-Robots-Tag': 'noindex, nofollow',
  } : {
    'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
  }

  if (!data && previewLocations.length === 0) {
    return Response.json(
      { error: 'Property locations are temporarily unavailable.' },
      { status: 503, ...(localPreview ? { headers } : {}) },
    )
  }

  return Response.json(
    { locations: buildPropertyLocationGroups([...(data ?? []), ...previewLocations]) },
    { headers },
  )
}
