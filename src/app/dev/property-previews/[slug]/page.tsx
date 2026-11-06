import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyDetailView } from '@/components/properties/PropertyDetailView'
import { loadPropertyPreview, loadPropertyPreviews, type PropertyPreview } from '@/lib/property-previews'
import { isBrochureDemoEnabled } from '@/lib/brochures/local-demo'
import { belongsToDevelopment, type DevelopmentProperty } from '@/lib/property-developments'

function developmentProperty({ document, kind, media }: PropertyPreview): DevelopmentProperty {
  const design = document.designVariants?.[0]
  return {
    _id: document._id, title: document.title, slug: document.slug.current,
    community: document.community, city: document.city, country: document.country,
    masterDevelopment: document.masterDevelopment,
    unitType: kind === 'development' ? 'Development' : document.unitType,
    bedrooms: document.bedrooms, summary: document.summary, amenities: document.amenities,
    priceAmount: document.priceAmount, priceCurrency: document.priceCurrency, priceDisplay: document.priceDisplay,
    designCount: document.designVariants?.length,
    designImage: { ...(design?.images[0] ?? media.hero), ...(design?.images[0] ? { label: design.label } : {}) },
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const preview = await loadPropertyPreview((await params).slug)
  return { title: preview ? `${preview.document.title} · Local draft` : 'Draft unavailable' }
}

export default async function PropertyPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const previews = await loadPropertyPreviews()
  const slug = (await params).slug
  const preview = previews.find(({ document }) => document.slug.current === slug)
  if (!preview) notFound()

  const overview = developmentProperty(preview)
  const development = preview.kind === 'development' ? {
    ...overview,
    collections: previews.filter(({ kind }) => kind === 'home-type').map(developmentProperty)
      .filter((home) => belongsToDevelopment(home, overview)),
  } : undefined

  const brochureDemo = isBrochureDemoEnabled() && (
    preview.kind === 'development' || (preview.kind === 'home-type' &&
      Boolean(preview.document.designVariants?.some((design) => design.brochureKey ?? preview.document.brochureKey)))
  )
  return <PropertyDetailView property={{ ...preview.document, slug: preview.document.slug.current }}
    media={preview.media} preview={{ kind: preview.kind, brochureDemo }} development={development} />
}
