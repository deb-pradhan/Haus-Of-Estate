import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PropertyDetailView } from '@/components/properties/PropertyDetailView'
import { loadPropertyPreview } from '@/lib/property-previews'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const preview = await loadPropertyPreview((await params).slug)
  return { title: preview ? `${preview.document.title} · Local draft` : 'Draft unavailable' }
}

export default async function PropertyPreviewPage({ params }: { params: Promise<{ slug: string }> }) {
  const preview = await loadPropertyPreview((await params).slug)
  if (!preview) notFound()

  return <PropertyDetailView property={{ ...preview.document, slug: preview.document.slug.current }} media={preview.media} preview={{ kind: preview.kind }} />
}
