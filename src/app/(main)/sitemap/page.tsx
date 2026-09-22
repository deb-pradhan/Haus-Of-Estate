import type { Metadata } from 'next'
import Link from 'next/link'
import { getPublicSitemap } from '@/lib/public-sitemap'
import { DEFAULT_OG_IMAGES } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Find Haus of Estate pages, properties, articles and current career opportunities.',
  alternates: { canonical: '/sitemap' },
  openGraph: {
    title: 'Sitemap — Haus of Estate',
    description: 'Explore the pages, properties and articles on Haus of Estate.',
    url: '/sitemap',
    type: 'website',
    images: DEFAULT_OG_IMAGES,
  },
}

export const revalidate = 60

export default async function SitemapPage() {
  const { pages, posts, properties, careers } = await getPublicSitemap()
  const sections = [
    { title: 'Explore Haus of Estate', links: pages.filter(({ path }) => path !== '/sitemap') },
    { title: 'Properties', links: properties.map(({ title, slug }) => ({ title, path: `/properties/${slug}` })) },
    { title: 'Articles', links: posts.map(({ title, slug }) => ({ title, path: `/blog/${slug}` })) },
    { title: 'Career opportunities', links: careers.map(({ title, slug }) => ({ title, path: `/careers/${slug}` })) },
  ]

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-estate-700 px-4 py-16 text-white md:px-6 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">Find your way</p>
          <h1 className="mt-4 font-serif text-4xl font-medium md:text-5xl">Sitemap</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80">Browse our services, property listings and articles in one place.</p>
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-16">
        {sections.filter(({ links }) => links.length > 0).map(({ title, links }) => (
          <section key={title}>
            <h2 className="border-b border-border pb-4 font-serif text-2xl font-medium text-estate-700">{title}</h2>
            <ul className="mt-4 space-y-2">
              {links.map((link) => (
                <li key={link.path}>
                  <Link href={link.path} className="inline-flex min-h-11 items-center text-sm text-estate-700 underline-offset-4 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-estate-700">
                    {link.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
