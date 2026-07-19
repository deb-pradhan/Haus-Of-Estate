import type { Metadata } from 'next'
import {
  PropertyListing,
  type PropertyListingSearchParams,
} from '@/components/properties/property-listing'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Commercial Property',
  description:
    'Offices, retail, shopping malls and commercial plots — ready and off-plan. Tell us your brief and we will source the right opportunity.',
  alternates: { canonical: '/properties/commercial' },
  openGraph: {
    title: 'Commercial Property — Haus of Estate',
    description:
      'Offices, retail, shopping malls and commercial plots — ready and off-plan.',
    url: '/properties/commercial',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export const revalidate = 60

export default async function CommercialLandingPage({
  searchParams,
}: {
  searchParams: Promise<PropertyListingSearchParams>
}) {
  const params = await searchParams
  return (
    <PropertyListing
      params={params}
      forceCategory="commercial"
      eyebrow="Commercial"
      heading={
        <>
          Commercial property{' '}
          <span className="text-gold-400">with proof.</span>
        </>
      }
      intro="Offices, retail units, shopping malls and commercial plots — ready and off-plan. We don't have commercial listings published yet, so tell us your brief and an advisor will source the right opportunity."
    />
  )
}
