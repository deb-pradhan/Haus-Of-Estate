import { notFound } from 'next/navigation'
import { loadPropertyPreview } from '@/lib/property-previews'
import { isBrochureDemoEnabled } from '@/lib/brochures/local-demo'
import { BrochureJourneyDemo } from './journey'

export const metadata = { title: 'Brochure request demonstration', robots: { index: false, follow: false } }

export default async function BrochureDemoPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ design?: string | string[] }>
}) {
  if (!isBrochureDemoEnabled()) notFound()
  const preview = await loadPropertyPreview((await params).slug)
  if (!preview || preview.kind !== 'home-type') notFound()
  const designs = preview.document.designVariants?.filter((design) => design.brochureKey ?? preview.document.brochureKey)
  if (!designs?.length) notFound()
  const requestedDesign = (await searchParams).design
  if (requestedDesign !== undefined && (typeof requestedDesign !== 'string' ||
    !designs.some((design) => design._key === requestedDesign))) notFound()
  const { document } = preview
  return <BrochureJourneyDemo
    key={requestedDesign ?? 'choose'}
    initialDesignId={requestedDesign}
    project={{
      slug: document.slug.current, title: document.title, country: document.country,
      city: document.city, community: document.community, unitType: document.unitType,
      bedrooms: document.bedrooms,
    }}
    designs={designs.map((design) => ({
      id: design._key, label: design.label, summary: design.summary,
      brochureKey: (design.brochureKey ?? document.brochureKey)!,
      image: design.images[0] ?? preview.media.hero,
      sellableAreaSqFt: design.sellableAreaSqFt,
      plotAreaSqFt: design.plotAreaStatus === 'conflict' ? undefined : design.plotAreaSqFt,
      plotAreaStatus: design.plotAreaStatus,
      position: design.position,
    }))}
  />
}
