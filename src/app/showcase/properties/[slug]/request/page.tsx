import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BrochureRequestJourney } from '@/components/showcase/brochure-request'
import { showcasePropertyPath } from '@/lib/showcase/access'
import { collectionLabel, findShowcaseCommunity, findShowcaseProperty } from '@/lib/showcase/fixture'

export const metadata: Metadata = { title: 'Request a brochure (simulated)' }

export default async function ShowcaseBrochureRequestPage({ params, searchParams }: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ design?: string | string[] }>
}) {
  const property = findShowcaseProperty((await params).slug)
  if (!property || property.kind !== 'home-type' || property.display.brochureMode !== 'simulated-only') notFound()
  const designs = property.designs.filter((design) => design.brochureKey)
  if (!designs.length) notFound()
  const requested = (await searchParams).design
  if (requested !== undefined && (typeof requested !== 'string' || !designs.some((design) => design.key === requested))) notFound()
  const community = findShowcaseCommunity(property)

  return (
    <BrochureRequestJourney
      key={requested ?? 'choose'}
      project={{
        slug: property.slug,
        title: property.title,
        label: collectionLabel(property),
        community: property.community,
        city: property.city,
        country: property.country,
        communityTitle: community?.overview.title,
        communityHref: community ? showcasePropertyPath(community.overview.slug) : undefined,
      }}
      areaLabel={property.display.areaLabel}
      areaSourceLabel={property.display.areaSourceLabel}
      initialDesignId={requested}
      designs={designs.map((design) => ({
        id: design.key,
        label: design.label,
        family: design.family,
        rowHomes: design.rowHomes,
        position: design.position,
        brochureKey: design.brochureKey!,
        builtUpAreaSqFt: design.builtUpAreaSqFt,
        plotAreaSqFt: design.plotAreaSqFt,
        plotAreaStatus: design.plotAreaStatus,
        areaNote: design.areaNote,
        image: design.images[0] ?? property.media.hero,
      }))}
    />
  )
}
