import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Property Renovation Services UAE & UK',
  description:
    'Get your property let-, sale- or move-in ready with Haus of Estate. Vetted, insured trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE — managed end to end with clear timelines and no hidden fees.',
  alternates: { canonical: '/renovations' },
  openGraph: {
    title: 'Property Renovation Services UAE & UK — Haus of Estate',
    description:
      'Vetted, insured trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE — managed end to end, with clear timelines and no hidden fees.',
    url: '/renovations',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export default function RenovationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
