import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'jdxbkry4',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  useCdn: false,
})

const builder = createImageUrlBuilder(client)

export { client }

type SanityImageSource = Parameters<typeof builder.image>[0]

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export async function sanityFetch<const T>({
  query,
  params = {},
  throwOnError = false,
}: {
  query: string
  params?: Record<string, unknown>
  throwOnError?: boolean
}): Promise<{ data: T | null }> {
  try {
    const data = await client.fetch(query, params)
    return { data }
  } catch (error) {
    console.error('Sanity fetch error:', error)
    if (throwOnError) throw error
    return { data: null }
  }
}
