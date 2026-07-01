import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Property Renovation Services UAE & UK | Haus of Estate',
  description:
    'Get your property let-, sale- or move-in ready with Haus of Estate. Vetted, insured trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE — managed end to end with clear timelines and no hidden fees.',
  openGraph: {
    title: 'Property Renovation Services UAE & UK | Haus of Estate',
    description:
      'Vetted, insured trades across painting, plumbing, decorating, electrical and flooring in the UK and UAE — managed end to end, with clear timelines and no hidden fees.',
  },
}

export default function RenovationsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
