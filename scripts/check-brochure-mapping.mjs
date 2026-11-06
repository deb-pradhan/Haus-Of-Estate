#!/usr/bin/env node
// Read-only audit: does each collection in the private brochure catalog have
// published designs whose brochure key and revision match it? Prints a JSON
// report of slugs, design labels and reason codes only. It never writes to
// Sanity, the database or the catalog, and it never reads PDF contents.
import { open } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createClient } from "@sanity/client";
import { checkBrochureMapping } from "../src/lib/brochures/mapping-check.ts";
import { PUBLISHED_PROPERTY_QUERY } from "../src/lib/lead-intake/project.ts";
import { sanityApiVersion, sanityDataset, sanityProjectId } from "../src/sanity/config.ts";

const MAX_CATALOG_BYTES = 1_048_576;

/** Bounded read of the private catalog; the same shape the runtime catalog reader accepts. */
export async function readCatalogEntries(catalogPath) {
  if (typeof catalogPath !== "string" || !path.isAbsolute(catalogPath)) {
    throw new Error("BROCHURE_CATALOG_PATH (or --catalog) must be an absolute path to the private catalog.json");
  }
  const handle = await open(catalogPath, "r");
  try {
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_CATALOG_BYTES) throw new Error("Catalog must be a JSON file of at most 1 MiB");
    const bytes = Buffer.alloc(MAX_CATALOG_BYTES + 1);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (bytesRead > MAX_CATALOG_BYTES) throw new Error("Catalog must be a JSON file of at most 1 MiB");
    const catalog = JSON.parse(bytes.subarray(0, bytesRead).toString("utf8"));
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.entries) || catalog.entries.length > 1000) {
      throw new Error("Catalog schemaVersion must be 1 with at most 1000 entries");
    }
    return catalog.entries.map((entry) => ({
      key: entry?.key,
      revision: entry?.revision,
      propertySlugs: Array.isArray(entry?.propertySlugs) ? entry.propertySlugs : [],
      approved: entry?.approved === true,
    }));
  } finally {
    await handle.close().catch(() => undefined);
  }
}

export function createPublishedCollectionFetcher() {
  const client = createClient({
    projectId: sanityProjectId,
    dataset: sanityDataset,
    apiVersion: sanityApiVersion,
    useCdn: false,
    perspective: "published",
  });
  return (slug) => client.fetch(PUBLISHED_PROPERTY_QUERY, { slug });
}

/** `fetchDocument(slug)` resolves the published document or null. */
export async function runBrochureMappingCheck({ catalogPath, fetchDocument }) {
  const entries = await readCatalogEntries(catalogPath);
  const slugs = [...new Set(entries.flatMap((entry) => entry.propertySlugs))];
  const published = {};
  for (const slug of slugs) {
    try {
      const document = await fetchDocument(slug);
      published[slug] = document?.slug ? document : null;
    } catch {
      // A failed read is reported as unpublished for this run, not as approval.
      published[slug] = null;
    }
  }
  return {
    catalogEntries: entries.length,
    checked: slugs.length,
    ...checkBrochureMapping(entries, published),
  };
}

async function main() {
  const flagIndex = process.argv.indexOf("--catalog");
  const catalogPath = flagIndex >= 0 ? process.argv[flagIndex + 1] : process.env.BROCHURE_CATALOG_PATH;
  const report = await runBrochureMappingCheck({ catalogPath, fetchDocument: createPublishedCollectionFetcher() });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.summary.ready === report.collections.length && report.collections.length > 0 ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Brochure mapping check failed");
    process.exitCode = 1;
  });
}
