import type { Metadata } from 'next'
import Link from 'next/link'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { notFound } from 'next/navigation'
import { PropertyDetailView, type PropertyDetail } from '@/components/properties/PropertyDetailView'
import { resolvePropertyMedia } from '@/lib/property-detail-media'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Kore — local draft review',
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
}

export default async function KorePreview() {
  if (process.env.NODE_ENV !== 'development') notFound()
  const source = JSON.parse(await readFile(path.join(process.cwd(), 'scripts/kore-wellness-residence.staging-draft.ndjson'), 'utf8'))
  const property: PropertyDetail = { ...source, slug: source.slug.current }

  return <main id="main-content" className="min-h-screen bg-background pb-12">
    <div className="bg-estate-700 px-4 py-4 text-sm text-white md:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="font-semibold">Haus of Estate · Kore review</p>
        <p className="mt-2">Local draft preview — not published. Enquiries are disabled. Prices and sizes are the starting figures supplied by Haus; current inventory and project imagery still need confirmation.</p>
        <Link href="/dev/florence-preview" className="mt-3 inline-block py-2 underline underline-offset-4">Review Florence</Link>
      </div>
    </div>
    <PropertyDetailView property={property} media={resolvePropertyMedia(property)} preview={{ kind: 'development' }} previewBasePath="/properties" />
  </main>
}
