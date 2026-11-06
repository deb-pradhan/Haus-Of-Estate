import { isBrochureIdentifier } from "./catalog";

/**
 * Read-only comparison of the private brochure catalog with the published
 * collection documents that intake resolves at request time. It reports why a
 * collection could not fulfil a brochure request; it never changes data and it
 * never treats a catalog approval as proof that a PDF may be published.
 */

export interface CatalogMappingEntry {
  key: string;
  revision: string;
  propertySlugs: string[];
  approved: boolean;
}

export interface PublishedDesignVariant {
  _key: string;
  label?: string;
  brochureKey?: string;
  brochureRevision?: string;
}

export interface PublishedCollectionMapping {
  slug: string;
  title?: string;
  designVariants?: PublishedDesignVariant[];
}

export type MappingIssueCode =
  | "CATALOG_ENTRY_INVALID"
  | "SLUG_MAPPED_TO_MULTIPLE_KEYS"
  | "CATALOG_NOT_APPROVED"
  | "COLLECTION_NOT_PUBLISHED"
  | "COLLECTION_HAS_NO_DESIGNS"
  | "DESIGN_MISSING_BROCHURE_KEY"
  | "DESIGN_KEY_MISMATCH"
  | "DESIGN_MISSING_REVISION"
  | "DESIGN_REVISION_MISMATCH"
  | "COLLECTION_MIXED_KEYS";

export interface MappingIssue {
  code: MappingIssueCode;
  /** Design labels or identifiers only; never visitor data or file paths. */
  designs?: string[];
}

export type CollectionMappingStatus = "ready" | "blocked" | "unpublished";

export interface CollectionMappingResult {
  slug: string;
  catalogKey: string;
  revision: string;
  approved: boolean;
  status: CollectionMappingStatus;
  /** Published designs that currently resolve to this approved key and revision. */
  requestableDesigns: number;
  totalDesigns: number;
  issues: MappingIssue[];
}

export interface BrochureMappingReport {
  collections: CollectionMappingResult[];
  summary: { ready: number; blocked: number; unpublished: number };
  /** Slugs whose every published design can be requested once intake and delivery are enabled. */
  readyForRequests: string[];
}

function designName(design: PublishedDesignVariant): string {
  return design.label?.trim() || design._key;
}

function entryIsValid(entry: CatalogMappingEntry): boolean {
  return isBrochureIdentifier(entry.key) && isBrochureIdentifier(entry.revision) &&
    typeof entry.approved === "boolean" && Array.isArray(entry.propertySlugs) &&
    entry.propertySlugs.length > 0 && entry.propertySlugs.every(isBrochureIdentifier);
}

/**
 * `published` maps each catalog slug to its published document, or `null` when
 * no published document exists for that slug.
 */
export function checkBrochureMapping(
  entries: CatalogMappingEntry[],
  published: Record<string, PublishedCollectionMapping | null | undefined>,
): BrochureMappingReport {
  const slugCounts = new Map<string, number>();
  for (const entry of entries) {
    for (const slug of entry.propertySlugs ?? []) slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
  }

  const collections: CollectionMappingResult[] = [];
  for (const entry of entries) {
    const valid = entryIsValid(entry);
    for (const slug of entry.propertySlugs ?? []) {
      const issues: MappingIssue[] = [];
      if (!valid) issues.push({ code: "CATALOG_ENTRY_INVALID" });
      if ((slugCounts.get(slug) ?? 0) > 1) issues.push({ code: "SLUG_MAPPED_TO_MULTIPLE_KEYS" });
      if (entry.approved !== true) issues.push({ code: "CATALOG_NOT_APPROVED" });

      const document = published[slug];
      let status: CollectionMappingStatus = "blocked";
      let requestableDesigns = 0;
      let totalDesigns = 0;
      if (!document?.slug) {
        status = "unpublished";
        issues.push({ code: "COLLECTION_NOT_PUBLISHED" });
      } else {
        const designs = document.designVariants ?? [];
        totalDesigns = designs.length;
        if (!designs.length) issues.push({ code: "COLLECTION_HAS_NO_DESIGNS" });
        const missingKey = designs.filter((design) => !design.brochureKey);
        const wrongKey = designs.filter((design) => design.brochureKey && design.brochureKey !== entry.key);
        const missingRevision = designs.filter((design) => design.brochureKey === entry.key && !design.brochureRevision);
        const wrongRevision = designs.filter((design) =>
          design.brochureKey === entry.key && design.brochureRevision && design.brochureRevision !== entry.revision);
        if (missingKey.length) issues.push({ code: "DESIGN_MISSING_BROCHURE_KEY", designs: missingKey.map(designName) });
        if (wrongKey.length) issues.push({ code: "DESIGN_KEY_MISMATCH", designs: wrongKey.map(designName) });
        if (missingRevision.length) issues.push({ code: "DESIGN_MISSING_REVISION", designs: missingRevision.map(designName) });
        if (wrongRevision.length) issues.push({ code: "DESIGN_REVISION_MISMATCH", designs: wrongRevision.map(designName) });
        const keys = new Set(designs.map((design) => design.brochureKey ?? ""));
        if (keys.size > 1) issues.push({ code: "COLLECTION_MIXED_KEYS" });
        requestableDesigns = valid && entry.approved === true
          ? designs.filter((design) => design.brochureKey === entry.key && design.brochureRevision === entry.revision).length
          : 0;
        status = issues.length ? "blocked" : "ready";
      }
      collections.push({
        slug,
        catalogKey: entry.key,
        revision: entry.revision,
        approved: entry.approved === true,
        status,
        requestableDesigns,
        totalDesigns,
        issues,
      });
    }
  }

  const summary = { ready: 0, blocked: 0, unpublished: 0 };
  for (const collection of collections) summary[collection.status] += 1;
  return {
    collections,
    summary,
    readyForRequests: collections.filter((collection) => collection.status === "ready").map((collection) => collection.slug),
  };
}
