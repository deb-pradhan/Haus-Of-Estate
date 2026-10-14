import { createClient } from '@sanity/client'
import { createImageUrlBuilder } from '@sanity/image-url'
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
} from './config'

const client = createClient({
  projectId: sanityProjectId,
  dataset: sanityDataset,
  apiVersion: sanityApiVersion,
  useCdn: false,
})

const builder = createImageUrlBuilder(client)

export { client }

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source)
}
