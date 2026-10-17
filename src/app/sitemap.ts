import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/sanity'
import { buildSitemapEntries, type SitemapSource } from '@/lib/seo'

// Read-only Sanity queries. `_updatedAt` gives each URL a real <lastmod>, and
// the word count lets the sitemap leave out thin posts that are noindexed.
// The thin-post threshold lives in src/lib/seo.ts (THIN_POST_WORDS).
const SITEMAP_POSTS_QUERY = `
  *[_type == "post" && status == "published" && defined(slug.current) && !(_id in path("drafts.**"))] {
    "slug": slug.current,
    "updatedAt": _updatedAt,
    publishedAt,
    "wordCount": length(string::split(pt::text(body), " "))
  }
`

const SITEMAP_PROPERTIES_QUERY = `
  *[_type == "property" && status == "published" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(slug.current)] {
    "slug": slug.current,
    "updatedAt": _updatedAt
  }
`

const SITEMAP_FAQ_QUERY = `
  *[_type == "faq" && status == "published"] | order(_updatedAt desc)[0]._updatedAt
`

// Never let the sitemap throw: fall back to the static routes if Sanity is down.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, properties, faqUpdatedAt] = await Promise.all([
    sanityFetch<SitemapSource['posts']>({ query: SITEMAP_POSTS_QUERY }),
    sanityFetch<SitemapSource['properties']>({ query: SITEMAP_PROPERTIES_QUERY }),
    sanityFetch<string>({ query: SITEMAP_FAQ_QUERY }),
  ]).catch(() => [{ data: null }, { data: null }, { data: null }] as const)

  return buildSitemapEntries({
    posts: posts.data ?? [],
    properties: properties.data ?? [],
    faqUpdatedAt: faqUpdatedAt.data,
  })
}
