import type { Metadata } from 'next'
import {
  PropertyListing,
  type PropertyListingSearchParams,
} from '@/components/properties/property-listing'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Properties',
  description:
    'Search the homes Haus of Estate currently has published in Dubai and the UK, then enquire and an adviser will reply to you directly.',
  alternates: { canonical: '/properties' },
  openGraph: {
    title: 'Properties — Haus of Estate',
    description:
      'Explore homes across our partner communities — starting with Al Furjan, Dubai.',
    url: '/properties',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export const revalidate = 60

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<PropertyListingSearchParams>
}) {
  const params = await searchParams
  return <PropertyListing params={params} />
}
