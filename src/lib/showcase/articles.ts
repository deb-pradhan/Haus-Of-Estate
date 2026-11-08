import 'server-only'

import palmSprings from '../../../content/blog/palm-springs-by-nakheel-dubai.json'
import { findLaunchInterest, LAUNCH_SECTION_ID, type LaunchInterest } from '@/lib/launches/registry'

/**
 * Draft articles the protected showcase can preview before they exist in
 * Sanity. Each source file is the paste-ready draft for the existing post
 * workflow; the adapter only checks the shape the blog renderer expects and
 * points in-article register links at the preview's own simulated form.
 */

export interface ShowcaseArticle {
  slug: string
  title: string
  subtitle?: string
  status: string
  preparedOn: string
  source: string
  categorySlugs: string[]
  seo: { seoTitle?: string; seoDesc?: string }
  body: Array<Record<string, unknown>>
  launch?: LaunchInterest
  reviewFlags: string[]
  editorialGuidance?: { primaryKeyword?: string; secondaryKeywords?: string[]; internalLinks?: string[]; note?: string }
}

type Raw = Record<string, unknown>
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const REGISTER_LINK = /^https:\/\/(?:www\.)?hausofestate\.com\/register-interest(?:\?|$)/

function invalid(detail: string): never {
  throw new Error(`Invalid showcase article: ${detail}`)
}

function text(value: unknown, detail: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(detail)
  return value.trim()
}

function optionalText(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function previewBody(body: unknown, detail: string): Array<Record<string, unknown>> {
  if (!Array.isArray(body) || !body.length) invalid(`${detail} body`)
  return body.map((block, index) => {
    if (!block || typeof block !== 'object' || Array.isArray(block)) invalid(`${detail} body[${index}]`)
    const raw = block as Raw
    if (raw._type !== 'block' || typeof raw._key !== 'string' || !Array.isArray(raw.children)) invalid(`${detail} body[${index}] must be a text block with a key`)
    const markDefs = Array.isArray(raw.markDefs)
      ? raw.markDefs.map((def) => {
          const mark = def as Raw
          return mark._type === 'link' && typeof mark.href === 'string' && REGISTER_LINK.test(mark.href)
            ? { ...mark, href: `#${LAUNCH_SECTION_ID}` }
            : mark
        })
      : []
    return { ...raw, markDefs }
  })
}

function article(raw: Raw): ShowcaseArticle {
  if (raw.schemaVersion !== 1) invalid('schema version')
  const post = raw.post as Raw | undefined
  if (!post || typeof post !== 'object') invalid('post')
  const slug = text((post.slug as Raw | undefined)?.current, 'slug')
  if (!SLUG.test(slug)) invalid('slug')
  if (post.featuredImage) invalid(`${slug} carries an image; approved media must go through Studio with alt text`)
  const launchKey = optionalText(raw.launchInterestKey)
  const launch = launchKey ? findLaunchInterest(launchKey) : undefined
  if (launchKey && !launch) invalid(`${slug} names an unknown launch ${launchKey}`)
  if (launch && launch.articleSlug !== slug) invalid(`${slug} does not match the launch article slug ${launch.articleSlug}`)
  const seo = (post.seo as Raw | undefined) ?? {}
  const title = text(post.title, `${slug} title`)
  if (title.length > 120) invalid(`${slug} title exceeds the 120-character schema limit`)
  const subtitle = optionalText(post.subtitle)
  if (subtitle && subtitle.length > 200) invalid(`${slug} subtitle exceeds the 200-character schema limit`)
  return {
    slug,
    title,
    subtitle,
    status: optionalText(post.status) ?? 'draft',
    preparedOn: text(raw.preparedOn, `${slug} preparedOn`),
    source: text(raw.source, `${slug} source`),
    categorySlugs: Array.isArray(post.categorySlugs) ? post.categorySlugs.filter((item): item is string => typeof item === 'string') : [],
    seo: { seoTitle: optionalText(seo.seoTitle), seoDesc: optionalText(seo.seoDesc) },
    body: previewBody(post.body, slug),
    launch,
    reviewFlags: Array.isArray(raw.reviewFlags) ? raw.reviewFlags.filter((item): item is string => typeof item === 'string') : [],
    editorialGuidance: raw.editorialGuidance as ShowcaseArticle['editorialGuidance'],
  }
}

let articles: ShowcaseArticle[] | undefined

export function getShowcaseArticles(): ShowcaseArticle[] {
  articles ??= [article(palmSprings as Raw)]
  return articles
}

export function findShowcaseArticle(slug: string): ShowcaseArticle | undefined {
  return getShowcaseArticles().find((item) => item.slug === slug)
}
