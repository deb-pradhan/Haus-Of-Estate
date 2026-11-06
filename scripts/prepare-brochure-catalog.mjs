#!/usr/bin/env node
import { createHash } from "node:crypto";
import { constants, createReadStream } from "node:fs";
import { copyFile, lstat, mkdir, open, readFile, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const identifier = (value) => typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value);
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
};

async function rejectGitDirectory(directory) {
  let current = directory;
  while (true) {
    try {
      await lstat(path.join(current, ".git"));
      throw new Error("Brochure storage must be outside Git repositories.");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    const parent = path.dirname(current);
    if (parent === current) return;
    current = parent;
  }
}

async function hashFile(filename) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(filename)) hash.update(chunk);
  return hash.digest("hex");
}

/** Local only: produces private, unapproved copies; never uploads or activates sending. */
export async function prepareBrochureCatalog({ manifest, sourceRoot, output }) {
  if (!sourceRoot || !output || !path.isAbsolute(sourceRoot) || !path.isAbsolute(output)) {
    throw new Error("--source-root and --output must be absolute paths.");
  }
  const root = await realpath(sourceRoot);
  const parent = await realpath(path.dirname(output));
  const destination = path.join(parent, path.basename(output));
  if (destination === root || inside(root, destination)) throw new Error("Output must be outside the source directory.");
  await rejectGitDirectory(parent);
  try {
    await lstat(destination);
    throw new Error("Output already exists; use a new directory.");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const supplied = JSON.parse(await readFile(manifest, "utf8"));
  if (supplied.schemaVersion !== 1 || !Array.isArray(supplied.brochures) ||
    !Array.isArray(supplied.documents) || supplied.brochures.length === 0) {
    throw new Error("Invalid brochure source manifest.");
  }
  const keys = new Set();
  const prepared = [];
  for (const entry of supplied.brochures) {
    if (!identifier(entry.key) || keys.has(entry.key) ||
      typeof entry.file !== "string" || !entry.file.toLowerCase().endsWith(".pdf") ||
      /[\\/:]/.test(entry.file) || entry.file.includes("..") ||
      !/^[a-f0-9]{64}$/.test(entry.sha256)) throw new Error("Invalid or duplicate source brochure.");
    keys.add(entry.key);
    const source = await realpath(path.join(root, entry.file));
    if (!inside(root, source) || !(await lstat(source)).isFile()) throw new Error("Source must be a PDF inside the source directory.");
    const handle = await open(source, "r");
    const header = Buffer.alloc(5);
    try {
      await handle.read(header, 0, 5, 0);
    } finally {
      await handle.close();
    }
    if (header.toString("ascii") !== "%PDF-" || await hashFile(source) !== entry.sha256) {
      throw new Error("Source PDF hash or signature does not match the supplied manifest.");
    }
    const propertySlugs = supplied.documents.filter((document) => document.brochureKey === entry.key)
      .map((document) => document.slug);
    if (propertySlugs.length === 0 || !propertySlugs.every(identifier) ||
      new Set(propertySlugs).size !== propertySlugs.length) throw new Error("Invalid brochure-to-property mapping.");
    const filename = `${entry.key}-${entry.sha256.slice(0, 12)}.pdf`;
    prepared.push({
      source,
      entry: { key: entry.key, revision: entry.sha256, filename, sha256: entry.sha256, propertySlugs, approved: false },
    });
  }
  if (supplied.documents.some((document) => !keys.has(document.brochureKey))) {
    throw new Error("A property references an unknown brochure.");
  }
  await mkdir(destination);
  await mkdir(path.join(destination, "files"));
  for (const item of prepared) {
    const target = path.join(destination, "files", item.entry.filename);
    await copyFile(item.source, target, constants.COPYFILE_EXCL);
    if (await hashFile(target) !== item.entry.sha256) throw new Error("Copied PDF failed hash verification.");
  }
  const catalog = { schemaVersion: 1, entries: prepared.map((item) => item.entry) };
  await writeFile(path.join(destination, "catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, { flag: "wx" });
  await writeFile(path.join(destination, "README.txt"), [
    "Private brochure preparation only. Nothing has been uploaded, approved or enabled.",
    "Keep this entire directory outside Git and outside the website public directory.",
    "Revision is the verified source PDF SHA-256. Originals were not modified.",
    "An authorised editor must confirm each brochure/property mapping and revision before setting approved:true.",
    "Do not enable customer delivery until DNS, runtime secrets, database, worker and recipient checks pass.",
    "Deploy files/ to private persistent storage; point BROCHURE_FILES_ROOT to that directory.",
    "BROCHURE_CATALOG_PATH must point to the private catalog.json; use absolute runtime paths.",
    "Never expose the PDF folder as static/public content.",
    "",
  ].join("\n"), { flag: "wx" });
  return { directory: destination, catalogPath: path.join(destination, "catalog.json"), entries: catalog.entries };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const parsed = {};
  if (args.includes("--help")) {
    console.log("node scripts/prepare-brochure-catalog.mjs --source-root <absolute source folder> --output <new absolute private folder> [--manifest <variants.json>]\nCopies verified PDFs outside Git. Entries remain approved:false. No upload or email.");
  } else {
    try {
      for (let index = 0; index < args.length; index += 2) {
        if (!["--manifest", "--source-root", "--output"].includes(args[index]) || !args[index + 1] || parsed[args[index]]) {
          throw new Error("Expected --source-root, --output and optional --manifest.");
        }
        parsed[args[index]] = args[index + 1];
      }
      const result = await prepareBrochureCatalog({
        manifest: parsed["--manifest"] || fileURLToPath(new URL("./azizi-florence.variants.json", import.meta.url)),
        sourceRoot: parsed["--source-root"],
        output: parsed["--output"],
      });
      console.log(`Prepared ${result.entries.length} unapproved brochures in ${result.directory}. No upload or activation performed.`);
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  }
}
