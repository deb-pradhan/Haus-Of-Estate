import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

const isProd = process.env.NODE_ENV === 'production'

if (isProd && !process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) {
  // Falling back silently would let a misconfigured preview read production data.
  console.warn(
    '[sanity] NEXT_PUBLIC_SANITY_PROJECT_ID is not set; using the default project.',
  )
}

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'jdxbkry4',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  // Published content only (no token/drafts): the API CDN is safe in production
  // and keeps uncached list pages fast. Dev stays on the live API for instant edits.
  useCdn: isProd,
})

const builder = createImageUrlBuilder(client)

export { client }

type SanityImageSource = Parameters<typeof builder.image>[0]

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

/** Sanitised failure information: safe to log and to hand to UI code. */
export interface SanityFetchError {
  name: string
  message: string
  statusCode?: number
}

export interface SanityFetchResult<T> {
  data: T | null
  /** Set when the request failed, so callers can tell "empty" from "failed". */
  error: SanityFetchError | null
}

function sanitiseError(error: unknown): SanityFetchError {
  const e = (error ?? {}) as { name?: unknown; message?: unknown; statusCode?: unknown }
  return {
    name: typeof e.name === 'string' ? e.name : 'Error',
    // First line only, capped: Sanity messages can echo query fragments.
    message: String(typeof e.message === 'string' ? e.message : 'Unknown error')
      .split('\n')[0]
      .slice(0, 200),
    statusCode: typeof e.statusCode === 'number' ? e.statusCode : undefined,
  }
}

/**
 * Fetch from Sanity.
 *
 * - On failure a sanitised one-line error is logged on the server (never the
 *   params or a stack) and the result carries `error`, so callers can
 *   distinguish "no content" from "request failed".
 * - `throwOnError: true` rethrows. Use it in ISR pages/`generateStaticParams`
 *   before calling `notFound()`: when a background regeneration throws, Next.js
 *   keeps serving the last good page instead of caching an empty/404 one.
 * - The return type is a superset of the previous `{ data }`, so existing
 *   callers are unaffected.
 */
export async function sanityFetch<const T>({
  query,
  params = {},
  throwOnError = false,
}: {
  query: string
  params?: Record<string, unknown>
  throwOnError?: boolean
}): Promise<SanityFetchResult<T>> {
  try {
    const data = await client.fetch(query, params)
    return { data, error: null }
  } catch (error) {
    const safe = sanitiseError(error)
    console.error(
      `[sanity] fetch failed (${safe.name}${safe.statusCode ? ` ${safe.statusCode}` : ''}): ${safe.message}`,
    )
    if (throwOnError) throw error
    return { data: null, error: safe }
  }
}
