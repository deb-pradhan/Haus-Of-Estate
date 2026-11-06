import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { readCatalogEntries, runBrochureMappingCheck } from "./check-brochure-mapping.mjs";

const revision = "b5f47ea84e36b5b5a0b6ec23111517115728934349b9e6e64dcf36f0b0d1dd2d";

async function catalogFile(entries) {
  const directory = await mkdtemp(path.join(tmpdir(), "haus-brochure-mapping-"));
  const file = path.join(directory, "catalog.json");
  await writeFile(file, JSON.stringify({ schemaVersion: 1, entries }));
  return file;
}

test("reads only the mapping fields from the private catalog and requires an absolute path", async () => {
  const file = await catalogFile([{
    key: "villa-4br", revision, filename: "villa-4br.pdf", sha256: revision,
    propertySlugs: ["azizi-florence-4-bedroom-villas"], approved: false,
  }]);
  assert.deepEqual(await readCatalogEntries(file), [{
    key: "villa-4br", revision, propertySlugs: ["azizi-florence-4-bedroom-villas"], approved: false,
  }]);
  await assert.rejects(readCatalogEntries("relative/catalog.json"), /absolute path/);
});

test("reports published mapping state per collection without touching anything", async () => {
  const file = await catalogFile([{
    key: "villa-4br", revision, filename: "villa-4br.pdf", sha256: revision,
    propertySlugs: ["azizi-florence-4-bedroom-villas", "azizi-florence-unpublished"], approved: true,
  }]);
  const fetched = [];
  const report = await runBrochureMappingCheck({
    catalogPath: file,
    fetchDocument: async (slug) => {
      fetched.push(slug);
      if (slug === "azizi-florence-unpublished") throw new Error("network");
      return {
        slug,
        title: "Florence 4-bedroom villas",
        designVariants: [
          { _key: "a", label: "Villa A", brochureKey: "villa-4br", brochureRevision: revision },
          { _key: "b", label: "Villa B" },
        ],
      };
    },
  });
  assert.deepEqual(fetched, ["azizi-florence-4-bedroom-villas", "azizi-florence-unpublished"]);
  assert.equal(report.catalogEntries, 1);
  assert.equal(report.checked, 2);
  assert.deepEqual(report.summary, { ready: 0, blocked: 1, unpublished: 1 });
  const [villas, missing] = report.collections;
  assert.equal(villas.status, "blocked");
  assert.deepEqual(villas.issues, [{ code: "DESIGN_MISSING_BROCHURE_KEY", designs: ["Villa B"] }, { code: "COLLECTION_MIXED_KEYS" }]);
  assert.equal(villas.requestableDesigns, 1);
  assert.equal(missing.status, "unpublished");
  assert.equal(JSON.stringify(report).includes("@"), false);
});
