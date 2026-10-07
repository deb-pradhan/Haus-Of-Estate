import type { MetadataRoute } from 'next'
import { HAUS_SITE_ORIGIN } from '@/lib/share'

const SITE_URL = HAUS_SITE_ORIGIN

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/studio/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
