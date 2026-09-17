import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity/live'
import { POST_SLUGS_QUERY, PROPERTY_SLUGS_QUERY } from '@/sanity/queries'
import { HAUS_SITE_ORIGIN } from '@/lib/share'

const SITE_URL = HAUS_SITE_ORIGIN

interface ContentSitemapEntry {
  slug: string
  _updatedAt?: string | null
}

function modificationMetadata(updatedAt: string | null | undefined) {
  if (!updatedAt) return {}
  const date = new Date(updatedAt)
  return Number.isNaN(date.valueOf()) ? {} : { lastModified: date }
}

// Static routes with sensible SEO weighting.
const STATIC_ROUTES: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'daily', priority: 1.0 },
  { path: '/properties', changeFrequency: 'daily', priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/snagging', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/renovations', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/team', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/careers', changeFrequency: 'weekly', priority: 0.6 },
  { path: '/faq', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/list-property', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.7 },
  ...(process.env.LEAD_INTAKE_ENABLED === 'true'
    ? [{
        path: '/register-interest',
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }, {
        path: '/enquire',
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }]
    : []),
  { path: '/legal/privacy-policy', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/terms-of-service', changeFrequency: 'yearly', priority: 0.3 },
  { path: '/legal/cookie-policy', changeFrequency: 'yearly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Omit dates for static pages until their actual content revision is known.
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const dynamicEntries: MetadataRoute.Sitemap = []

  // Pull dynamic blog post + property slugs from Sanity. Never let the
  // sitemap throw — fall back to static routes if anything goes wrong.
  try {
    const { data: posts } = await sanityFetch<ContentSitemapEntry[]>({
      query: POST_SLUGS_QUERY,
    })
    for (const post of posts ?? []) {
      if (post?.slug) {
        dynamicEntries.push({
          url: `${SITE_URL}/blog/${post.slug}`,
          ...modificationMetadata(post._updatedAt),
          changeFrequency: 'monthly',
          priority: 0.6,
        })
      }
    }
  } catch {
    // ignore — static routes still ship
  }

  try {
    const { data: properties } = await sanityFetch<ContentSitemapEntry[]>({
      query: PROPERTY_SLUGS_QUERY,
    })
    for (const property of properties ?? []) {
      if (property?.slug) {
        dynamicEntries.push({
          url: `${SITE_URL}/properties/${property.slug}`,
          ...modificationMetadata(property._updatedAt),
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      }
    }
  } catch {
    // ignore — static routes still ship
  }

  return [...staticEntries, ...dynamicEntries]
}
