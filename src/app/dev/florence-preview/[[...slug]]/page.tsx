import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readFlorenceReview } from '@/lib/florence-review'
import { PropertyDevelopmentCard } from '@/components/properties/property-development'
import { PropertyDetailView } from '@/components/properties/PropertyDetailView'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Florence — local draft review',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default async function FlorencePreview({ params }: { params: Promise<{ slug?: string[] }> }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const review = await readFlorenceReview()
  const { slug = [] } = await params
  if (!review || slug.length > 1) notFound()
  const property = slug[0] ? review.properties.find((item) => item.slug === slug[0]) : undefined
  if (slug[0] && !property) notFound()
  return <main id="main-content" className="min-h-screen bg-background pb-12">
    <div className="bg-estate-700 px-4 py-4 text-sm text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <Link href="/dev/florence-preview" className="font-semibold underline underline-offset-4">Haus of Estate · Florence review</Link>
        <p className="mt-2">Local draft preview — not published. Enquiries are disabled. Prices apply to Clusters 1 &amp; 2; individual inventory, payment terms and handover need confirmation.</p>
      </div>
    </div>
    {property ? <PropertyDetailView
      property={property}
      development={property._id === review.development._id ? review.development : undefined}
      parentDevelopment={property._id !== review.development._id ? review.development : undefined}
      preview
    /> : <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
      <h1 className="font-serif text-4xl text-estate-700">Explore communities</h1>
      <p className="mt-3 text-muted-foreground">This is the catalogue entry point. Open the community, then choose a home collection and design.</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <PropertyDevelopmentCard development={review.development} basePath="/dev/florence-preview" />
      </div>
    </section>}
  </main>
}
