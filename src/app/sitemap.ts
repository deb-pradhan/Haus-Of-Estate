import type { MetadataRoute } from 'next'
import { getPublicSitemap } from '@/lib/public-sitemap'
import { HAUS_SITE_ORIGIN } from '@/lib/share'

export const revalidate = 60

function modificationMetadata(updatedAt: string | null | undefined) {
  if (!updatedAt) return {}
  const date = new Date(updatedAt)
  return Number.isNaN(date.valueOf()) ? {} : { lastModified: date }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { pages, posts, properties, careers } = await getPublicSitemap()
  return [
    ...pages.map(({ path, changeFrequency, priority }) => ({ url: `${HAUS_SITE_ORIGIN}${path}`, changeFrequency, priority })),
    ...posts.map((post) => ({
      url: `${HAUS_SITE_ORIGIN}/blog/${post.slug}`,
      ...modificationMetadata(post._updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...properties.map((property) => ({
      url: `${HAUS_SITE_ORIGIN}/properties/${property.slug}`,
      ...modificationMetadata(property._updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...careers.map((role) => ({
      url: `${HAUS_SITE_ORIGIN}/careers/${role.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })),
  ]
}
