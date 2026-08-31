import "server-only";

import type { QueryParams } from "@sanity/client";
import { defineLive } from "next-sanity/live";
import { client } from "./client";

const readToken = process.env.SANITY_API_READ_TOKEN || false;
const browserToken = process.env.SANITY_API_BROWSER_TOKEN || false;

export const isSanityLivePreviewConfigured = Boolean(readToken && browserToken);

const { sanityFetch: liveFetch, SanityLive } = defineLive({
  client,
  serverToken: readToken,
  browserToken,
});

export { SanityLive };

export async function sanityFetch<const T>({
  query,
  params = {},
}: {
  query: string;
  params?: QueryParams;
}): Promise<{ data: T | null }> {
  try {
    // Keep source-map encoding off until every URL, comparison, metadata field,
    // and JSON-LD value has been audited for invisible stega characters.
    const result = await liveFetch({ query, params, stega: false });
    return { data: result.data as T };
  } catch (error) {
    console.error("Sanity fetch failed", {
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return { data: null };
  }
}
