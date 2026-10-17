import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Property Renovation Services UAE & UK',
  description:
    'Get your property let-, sale- or move-in ready. Haus of Estate introduces you to trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE. Your contract is with the trade you choose.',
  alternates: { canonical: '/renovations' },
  openGraph: {
    title: 'Property Renovation Services UAE & UK — Haus of Estate',
    description:
      'Introductions to trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE.',
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
