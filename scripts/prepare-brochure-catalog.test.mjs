import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { prepareBrochureCatalog } from "./prepare-brochure-catalog.mjs";

async function fixture(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "haus-brochure-prep-"));
  const sourceRoot = path.join(directory, "sources");
  await mkdir(sourceRoot);
  const pdf = Buffer.from("%PDF-1.4\nsynthetic\n%%EOF");
  const hash = createHash("sha256").update(pdf).digest("hex");
  await writeFile(path.join(sourceRoot, "Source.pdf"), pdf);
  const manifest = path.join(directory, "variants.json");
  const data = {
    schemaVersion: 1,
    brochures: [{ key: "townhouses", file: "Source.pdf", sha256: hash }],
    documents: [{ slug: "three-bedroom", brochureKey: "townhouses" }, { slug: "four-bedroom", brochureKey: "townhouses" }],
  };
  await writeFile(manifest, JSON.stringify(data));
  try {
    await run({ directory, sourceRoot, pdf, hash, manifest, data });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test("prepares one reusable PDF, preserves originals and never approves automatically", async () => fixture(async (f) => {
  const result = await prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output: path.join(f.directory, "output") });
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].approved, false);
  assert.equal(result.entries[0].revision, f.hash);
  assert.deepEqual(result.entries[0].propertySlugs, ["three-bedroom", "four-bedroom"]);
  assert.deepEqual(await readFile(path.join(result.directory, "files", result.entries[0].filename)), f.pdf);
  assert.deepEqual(await readFile(path.join(f.sourceRoot, "Source.pdf")), f.pdf);
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output: result.directory }), /already exists/);
}));

test("refuses source-directory and Git-directory outputs", async () => fixture(async (f) => {
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output: path.join(f.sourceRoot, "output") }), /outside the source/);
  const repository = path.join(f.directory, "repository");
  await mkdir(repository);
  await writeFile(path.join(repository, ".git"), "gitdir: synthetic-test");
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output: path.join(repository, "output") }), /outside Git/);
}));

test("refuses unknown mapping, wrong hashes and source traversal before writing output", async () => fixture(async (f) => {
  const output = path.join(f.directory, "output");
  f.data.documents.push({ slug: "unknown", brochureKey: "not-present" });
  await writeFile(f.manifest, JSON.stringify(f.data));
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output }), /unknown brochure/);
  f.data.documents.pop();
  f.data.brochures[0].sha256 = "0".repeat(64);
  await writeFile(f.manifest, JSON.stringify(f.data));
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output }), /hash or signature/);
  f.data.brochures[0].file = "../Source.pdf";
  await writeFile(f.manifest, JSON.stringify(f.data));
  await assert.rejects(() => prepareBrochureCatalog({ manifest: f.manifest, sourceRoot: f.sourceRoot, output }), /Invalid or duplicate/);
}));
