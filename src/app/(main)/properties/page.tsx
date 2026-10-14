import type { Metadata } from 'next'
import {
  PropertyListing,
  type PropertyListingSearchParams,
} from '@/components/properties/property-listing'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'
import { isLocalCataloguePreviewEnabled } from '@/lib/property-catalogue-preview'

const propertyMetadata: Metadata = {
  title: 'Properties',
  description:
    'Explore homes across our partner communities — starting with Al Furjan, Dubai. Enquire and we will connect you with a vetted agent.',
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

export function generateMetadata(): Metadata {
  if (!isLocalCataloguePreviewEnabled()) return propertyMetadata
  return {
    ...propertyMetadata,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  }
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
