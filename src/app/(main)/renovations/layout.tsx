import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Interiors & Renovations',
  description:
    'Explore interior design, room refreshes, renovations, furnishing, styling and lighting ideas with Haus of Estate. Tell us about your property and project goals.',
  alternates: { canonical: '/renovations' },
  openGraph: {
    title: 'Interiors & Renovations — Haus of Estate',
    description:
      'Explore design, renovation, furnishing and styling options, and discuss a brief for your property.',
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
