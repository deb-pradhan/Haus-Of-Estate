import type { Metadata } from 'next'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

const DESCRIPTION =
  'Looking to sell or let your property? Share your property details with Haus of Estate and tell our team how to contact you.'

export const metadata: Metadata = {
  title: 'List your property',
  description: DESCRIPTION,
  alternates: { canonical: '/list-property' },
  openGraph: {
    title: 'List your property — Haus of Estate',
    description: DESCRIPTION,
    url: '/list-property',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'List your property — Haus of Estate',
    description: DESCRIPTION,
    images: [DEFAULT_OG_IMAGES[0].url],
  },
}

export default function ListPropertyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
