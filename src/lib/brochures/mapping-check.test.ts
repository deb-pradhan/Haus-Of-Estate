import { describe, expect, it } from "vitest";
import { checkBrochureMapping, type CatalogMappingEntry } from "./mapping-check";

const revision = "d8842cb77697f8eb894289f7f0c2a655be2769b7ee4fef22cb5309ba83b7011d";

function entry(overrides: Partial<CatalogMappingEntry> = {}): CatalogMappingEntry {
  return {
    key: "townhouse-3-4br",
    revision,
    propertySlugs: ["azizi-florence-3-bedroom-townhouses", "azizi-florence-4-bedroom-townhouses"],
    approved: true,
    ...overrides,
  };
}

const design = (key: string, label: string, brochureKey?: string, brochureRevision?: string) =>
  ({ _key: key, label, brochureKey, brochureRevision });

describe("brochure mapping check", () => {
  it("marks a collection ready only when every published design resolves to the approved key and revision", () => {
    const report = checkBrochureMapping([entry()], {
      "azizi-florence-3-bedroom-townhouses": {
        slug: "azizi-florence-3-bedroom-townhouses",
        designVariants: [design("a", "Novoli 3", "townhouse-3-4br", revision), design("b", "Spada 3", "townhouse-3-4br", revision)],
      },
      "azizi-florence-4-bedroom-townhouses": {
        slug: "azizi-florence-4-bedroom-townhouses",
        designVariants: [design("c", "Spada 4 Home Corner", "townhouse-3-4br", revision)],
      },
    });
    expect(report.summary).toEqual({ ready: 2, blocked: 0, unpublished: 0 });
    expect(report.readyForRequests).toEqual(["azizi-florence-3-bedroom-townhouses", "azizi-florence-4-bedroom-townhouses"]);
    expect(report.collections[0]).toMatchObject({ requestableDesigns: 2, totalDesigns: 2, issues: [] });
  });

  it("blocks unapproved, unmapped, mismatched and mixed collections with design-level detail", () => {
    const report = checkBrochureMapping([entry({ approved: false })], {
      "azizi-florence-3-bedroom-townhouses": {
        slug: "azizi-florence-3-bedroom-townhouses",
        designVariants: [
          design("a", "Novoli 3"),
          design("b", "Spada 3", "villa-4br", revision),
          design("c", "Spada 3 Corner", "townhouse-3-4br"),
          design("d", "Novoli 3 Corner", "townhouse-3-4br", "0000000000000000000000000000000000000000000000000000000000000000"),
        ],
      },
      "azizi-florence-4-bedroom-townhouses": null,
    });
    const [three, four] = report.collections;
    expect(three.status).toBe("blocked");
    expect(three.requestableDesigns).toBe(0);
    expect(three.issues.map((issue) => issue.code)).toEqual([
      "CATALOG_NOT_APPROVED",
      "DESIGN_MISSING_BROCHURE_KEY",
      "DESIGN_KEY_MISMATCH",
      "DESIGN_MISSING_REVISION",
      "DESIGN_REVISION_MISMATCH",
      "COLLECTION_MIXED_KEYS",
    ]);
    expect(three.issues.find((issue) => issue.code === "DESIGN_MISSING_BROCHURE_KEY")?.designs).toEqual(["Novoli 3"]);
    expect(three.issues.find((issue) => issue.code === "DESIGN_KEY_MISMATCH")?.designs).toEqual(["Spada 3"]);
    expect(four).toMatchObject({ status: "unpublished", issues: [{ code: "CATALOG_NOT_APPROVED" }, { code: "COLLECTION_NOT_PUBLISHED" }] });
    expect(report.summary).toEqual({ ready: 0, blocked: 1, unpublished: 1 });
    expect(report.readyForRequests).toEqual([]);
  });

  it("does not count designs as requestable for an unapproved or invalid catalog entry even when they match", () => {
    const published = {
      "azizi-florence-4-bedroom-villas": {
        slug: "azizi-florence-4-bedroom-villas",
        designVariants: [design("a", "Villa A", "villa-4br", revision)],
      },
    };
    const unapproved = checkBrochureMapping([entry({ key: "villa-4br", propertySlugs: ["azizi-florence-4-bedroom-villas"], approved: false })], published);
    expect(unapproved.collections[0]).toMatchObject({ status: "blocked", requestableDesigns: 0, totalDesigns: 1 });
    const invalid = checkBrochureMapping([entry({ key: "Villa 4BR!", propertySlugs: ["azizi-florence-4-bedroom-villas"] })], published);
    expect(invalid.collections[0].issues.map((issue) => issue.code)).toContain("CATALOG_ENTRY_INVALID");
    expect(invalid.collections[0].requestableDesigns).toBe(0);
  });

  it("flags a slug that two catalog entries claim and empty collections", () => {
    const report = checkBrochureMapping([
      entry({ key: "villa-5br", propertySlugs: ["azizi-florence-5-bedroom-villas"] }),
      entry({ key: "villa-6br", propertySlugs: ["azizi-florence-5-bedroom-villas"] }),
    ], {
      "azizi-florence-5-bedroom-villas": { slug: "azizi-florence-5-bedroom-villas", designVariants: [] },
    });
    for (const collection of report.collections) {
      expect(collection.issues.map((issue) => issue.code)).toEqual(["SLUG_MAPPED_TO_MULTIPLE_KEYS", "COLLECTION_HAS_NO_DESIGNS"]);
      expect(collection.status).toBe("blocked");
    }
  });
});
