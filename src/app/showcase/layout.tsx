import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { isFixtureShowcaseEnabled } from '@/lib/showcase/access'
import { ShowcaseHeader } from '@/components/showcase/showcase-header'
import { ShowcaseFooter } from '@/components/showcase/showcase-footer'
import './showcase.css'

export const metadata: Metadata = {
  title: { default: 'Design showcase', template: '%s — Haus of Estate design showcase' },
  description: 'A protected design preview of the Haus of Estate property journey, built from a sanitized fixture. Not live inventory.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
  alternates: {},
  openGraph: { title: 'Haus of Estate design showcase', url: undefined },
}

// The gate must be evaluated per request, never frozen into a prerendered page.
export const dynamic = 'force-dynamic'

export default async function ShowcaseLayout({ children }: { children: React.ReactNode }) {
  await connection()
  if (!isFixtureShowcaseEnabled()) notFound()
  return (
    <div className="showcase flex min-h-screen flex-col bg-background">
      <p role="note" className="border-b border-gold-500/30 bg-[#f3eee2] px-4 py-2 text-center text-xs leading-5 text-estate-700">
        <strong className="font-semibold">Design showcase.</strong> Fixture content for review, not live inventory. Brochure requests are simulated; nothing is saved or sent.
      </p>
      <ShowcaseHeader />
      <main id="main-content" className="flex-1">{children}</main>
      <ShowcaseFooter />
    </div>
  )
}
