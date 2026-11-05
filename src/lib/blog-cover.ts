// Sonia supplied this Canva replacement on 5 November 2026. Match both the
// article and withdrawn asset so a later Sanity cover edit takes precedence.
export const DUBAI_ARTICLE_SLUG = 'from-palm-jumeirah-to-difc-how-rapid-execution-powers-dubai-property-growth'
export const DUBAI_CANVA_COVER = '/images/blog/dubai-it-canva-2026-11.webp'
const WITHDRAWN_ASSET_PATH = '/images/jdxbkry4/production/0452e218d2a9a0702d39bddfed605b040f82a7e5-1920x1080.jpg'

export function resolveBlogCover(slug: string, url: string, alt: string) {
  if (slug === DUBAI_ARTICLE_SLUG) {
    try {
      const source = new URL(url)
      if (source.hostname === 'cdn.sanity.io' && source.pathname === WITHDRAWN_ASSET_PATH) {
        return { url: DUBAI_CANVA_COVER, alt: 'Dubai skyline at dusk with Haus of Estate and Dubai IT branding' }
      }
    } catch {
      // Local artwork and missing covers keep their existing behaviour.
    }
  }
  return { url, alt }
}

export function blogCoverQuality(url: string) {
  // The original Canva PNG is now also stored in Sanity. Keep its text crisp.
  const suppliedAsset = 'https://cdn.sanity.io/images/jdxbkry4/production/d779c361dcdb87ff32a4eb6208c2bbe6be2accd1-1920x1080.png'
  return url === DUBAI_CANVA_COVER || url.split('?')[0] === suppliedAsset ? 90 : 75
}
