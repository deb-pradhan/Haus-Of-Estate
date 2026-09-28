import { describe, expect, it } from "vitest";
import {
  isValidSanityDocumentId,
  mergeSavedContentKeys,
  shouldRetainAnonymousSave,
  type SavedContentKey,
} from "@/components/saved-content/local-save-merge";

const property: SavedContentKey = {
  contentType: "PROPERTY",
  sanityDocumentId: "property-al-furjan",
};
const article: SavedContentKey = {
  contentType: "ARTICLE",
  sanityDocumentId: "article.market-update-2026",
};

describe("anonymous saved-content merging", () => {
  it("unions retryable local saves with remote state without duplicates", () => {
    expect(
      mergeSavedContentKeys([property], [property, article]),
    ).toEqual([property, article]);
  });

  it("retains transient failures and drops permanent stale-document responses", () => {
    expect(shouldRetainAnonymousSave()).toBe(true);
    expect(shouldRetainAnonymousSave(401)).toBe(true);
    expect(shouldRetainAnonymousSave(429)).toBe(true);
    expect(shouldRetainAnonymousSave(503)).toBe(true);
    expect(shouldRetainAnonymousSave(400)).toBe(false);
    expect(shouldRetainAnonymousSave(404)).toBe(false);
  });

  it("matches the server's published Sanity document ID boundary", () => {
    expect(isValidSanityDocumentId("property-al_furjan.2026")).toBe(true);
    expect(isValidSanityDocumentId(`p${"x".repeat(127)}`)).toBe(true);
    expect(isValidSanityDocumentId(`p${"x".repeat(128)}`)).toBe(false);
    expect(isValidSanityDocumentId("drafts.property-al-furjan")).toBe(false);
    expect(isValidSanityDocumentId("versions.release.property-al-furjan")).toBe(false);
  });
});
