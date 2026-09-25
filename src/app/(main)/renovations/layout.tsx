import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Property Renovation Services UAE & UK',
  description:
    'Get your property let-, sale- or move-in ready with Haus of Estate. Painting, decorating and flooring services in the UK and UAE.',
  alternates: { canonical: '/renovations' },
  openGraph: {
    title: 'Property Renovation Services UAE & UK — Haus of Estate',
    description:
      'Painting, decorating and flooring services for your property in the UK and UAE.',
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
