import 'server-only'

import type { MetadataRoute } from 'next'
import { client } from '@/sanity/client'
import { ROLES_QUERY } from '@/sanity/queries'
import { CAREERS_PUBLIC_ENABLED } from '@/lib/careers-availability'
import { resolveCareerRoles, type CareerRole } from '@/lib/career-roles'

export interface PublicPage {
  path: string
  title: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}

export interface SitemapContent {
  _id: string
  _originalId?: string
  title: string
  slug: string
  status: string
  _updatedAt?: string | null
}

const PUBLIC_CONTENT_FILTER = 'status == "published" && !(_id in path("drafts.**")) && !(_id in path("versions.**")) && defined(slug.current)'
const CONTENT_FIELDS = '_id, title, "slug": slug.current, status, _updatedAt'
export const SITEMAP_POSTS_QUERY = `*[_type == "post" && ${PUBLIC_CONTENT_FILTER}] | order(title asc) { ${CONTENT_FIELDS} }`
export const SITEMAP_PROPERTIES_QUERY = `*[_type == "property" && ${PUBLIC_CONTENT_FILTER}] | order(title asc) { ${CONTENT_FIELDS} }`

export function publicSitemapPages(): PublicPage[] {
  return [
    { path: '/', title: 'Home', changeFrequency: 'daily', priority: 1 },
    { path: '/properties', title: 'Properties', changeFrequency: 'daily', priority: 0.9 },
    { path: '/properties/residential', title: 'Residential property', changeFrequency: 'daily', priority: 0.8 },
    { path: '/properties/commercial', title: 'Commercial property', changeFrequency: 'daily', priority: 0.8 },
    { path: '/about', title: 'About us', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/services', title: 'Services', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/snagging', title: 'Snagging inspections', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/renovations', title: 'Renovations', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/team', title: 'Meet the team', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/faq', title: 'Frequently asked questions', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/blog', title: 'Articles', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/list-property', title: 'List your property', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/contact', title: 'Contact us', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/mortgage-calculator', title: 'Mortgage repayment calculator', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/sitemap', title: 'Sitemap', changeFrequency: 'weekly', priority: 0.3 },
    ...(CAREERS_PUBLIC_ENABLED ? [{ path: '/careers', title: 'Careers', changeFrequency: 'weekly' as const, priority: 0.6 }] : []),
    ...(process.env.LEAD_INTAKE_ENABLED === 'true' ? [
      { path: '/register-interest', title: 'Register your interest', changeFrequency: 'monthly' as const, priority: 0.8 },
      { path: '/enquire', title: 'Have a query?', changeFrequency: 'monthly' as const, priority: 0.6 },
    ] : []),
    { path: '/legal/privacy-policy', title: 'Privacy policy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legal/terms-of-service', title: 'Terms of service', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/legal/cookie-policy', title: 'Cookie policy', changeFrequency: 'yearly', priority: 0.3 },
  ]
}

export function publishedSitemapContent(records: SitemapContent[] | null): SitemapContent[] {
  const slugs = new Set<string>()
  return (records ?? []).filter((record) => {
    if (record.status !== 'published' || !record._id
      || /^(drafts|versions)\./.test(record._id)
      || /^(drafts|versions)\./.test(record._originalId ?? '')
      || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)
      || !record.title?.trim() || slugs.has(record.slug)) return false
    slugs.add(record.slug)
    return true
  })
}

export async function getPublicSitemap() {
  // Never inherit Draft Mode, a preview token or the editor's live perspective.
  const options = { perspective: 'published' as const, stega: false, next: { revalidate: 60 } }
  const [posts, properties, roles] = await Promise.allSettled([
    client.fetch<SitemapContent[]>(SITEMAP_POSTS_QUERY, {}, options),
    client.fetch<SitemapContent[]>(SITEMAP_PROPERTIES_QUERY, {}, options),
    CAREERS_PUBLIC_ENABLED ? client.fetch<CareerRole[]>(ROLES_QUERY, {}, options) : Promise.resolve([] as CareerRole[]),
  ])

  return {
    pages: publicSitemapPages(),
    posts: publishedSitemapContent(posts.status === 'fulfilled' ? posts.value : null),
    properties: publishedSitemapContent(properties.status === 'fulfilled' ? properties.value : null),
    careers: CAREERS_PUBLIC_ENABLED && roles.status === 'fulfilled'
      ? resolveCareerRoles(roles.value).filter((role) => !/^(drafts|versions)\./.test(role._id))
      : [],
  }
}
