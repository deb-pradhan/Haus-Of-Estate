import { buildPropertyLocationGroups } from '@/lib/property-locations'
import { sanityFetch } from '@/sanity'
import { PROPERTY_LOCATION_OPTIONS_QUERY } from '@/sanity/queries'

interface PropertyLocationRecord {
  country?: string | null
  city?: string | null
}

export async function GET() {
  const { data } = await sanityFetch<PropertyLocationRecord[]>({
    query: PROPERTY_LOCATION_OPTIONS_QUERY,
  })

  if (!data) {
    return Response.json(
      { error: 'Property locations are temporarily unavailable.' },
      { status: 503 },
    )
  }

  return Response.json(
    { locations: buildPropertyLocationGroups(data) },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      },
    },
  )
}
