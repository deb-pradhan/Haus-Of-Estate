import type { Metadata } from 'next'
import {
  PropertyListing,
  type PropertyListingSearchParams,
} from '@/components/properties/property-listing'

export const metadata: Metadata = {
  title: 'Residential Property | Haus of Estate',
  description:
    'Apartments, townhouses, villas and mansions across our partner communities — ready and off-plan. Enquire and we will connect you with a vetted agent.',
  alternates: { canonical: '/properties/residential' },
  openGraph: {
    title: 'Residential Property | Haus of Estate',
    description:
      'Apartments, townhouses, villas and mansions across our partner communities — ready and off-plan.',
    type: 'website',
  },
}

export const revalidate = 60

export default async function ResidentialLandingPage({
  searchParams,
}: {
  searchParams: Promise<PropertyListingSearchParams>
}) {
  const params = await searchParams
  return (
    <PropertyListing
      params={params}
      forceCategory="residential"
      eyebrow="Residential"
      heading={
        <>
          Residential homes{' '}
          <span className="text-gold-400">worth living in.</span>
        </>
      }
      intro="Apartments, townhouses, villas and mansions across our partner communities — ready to move or off-plan. Tell us your brief and we'll connect you with a vetted agent."
    />
  )
}
