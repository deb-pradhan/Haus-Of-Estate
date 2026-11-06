import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CollectionView } from '@/components/showcase/collection-view'
import { CommunityView } from '@/components/showcase/community-view'
import { ReadyHomeView } from '@/components/showcase/ready-home-view'
import { findShowcaseCommunity, findShowcaseProperty } from '@/lib/showcase/fixture'

type Params = Promise<{ slug: string }>
type SearchParams = Promise<{ design?: string | string[] }>

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const property = findShowcaseProperty((await params).slug)
  return property ? { title: property.title, description: property.summary } : { title: 'Not in this showcase' }
}

export default async function ShowcasePropertyPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const property = findShowcaseProperty((await params).slug)
  if (!property) notFound()
  const community = findShowcaseCommunity(property)
  if (property.kind === 'development') {
    if (!community) notFound()
    return <CommunityView community={community} />
  }
  if (property.kind === 'home-type') {
    const { design } = await searchParams
    return <CollectionView collection={property} community={community} initialDesignKey={typeof design === 'string' ? design : undefined} />
  }
  return <ReadyHomeView home={property} />
}
