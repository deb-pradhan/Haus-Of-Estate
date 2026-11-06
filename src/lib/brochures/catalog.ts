import { createHash } from "node:crypto";
import { open, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import type { FileHandle } from "node:fs/promises";

export type BrochureEnvironment = Readonly<Record<string, string | undefined>>;

export type BrochureSelection = {
  key: string;
  revision: string;
  projectSlug: string;
  projectTitle: string;
  designId?: string;
  designLabel?: string;
};

export type ApprovedBrochure = {
  key: string;
  revision: string;
  filename: string;
  sha256: string;
  propertySlugs: string[];
  filePath: string;
  sizeBytes: number;
};

export class BrochureUnavailableError extends Error {
  constructor() {
    super("Brochure unavailable");
    this.name = "BrochureUnavailableError";
  }
}

/** Retryable storage failure; never exposes filesystem paths or raw provider errors. */
export class BrochureStorageError extends BrochureUnavailableError {
  constructor() {
    super();
    this.name = "BrochureStorageError";
  }
}

const TRANSIENT_STORAGE_CODES = new Set(["EIO", "EMFILE", "ENFILE", "EAGAIN", "EBUSY", "ETIMEDOUT"]);

function storageFailure(error: unknown): BrochureUnavailableError {
  const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
  return typeof code === "string" && TRANSIENT_STORAGE_CODES.has(code)
    ? new BrochureStorageError()
    : new BrochureUnavailableError();
}

export function isBrochureIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]{0,127}$/.test(value);
}

function inside(root: string, target: string) {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith(`..${path.sep}`) &&
    relative !== ".." && !path.isAbsolute(relative);
}

function safeFilename(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9._-]*\.pdf$/i.test(value) &&
    value.length <= 180 && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(value);
}

async function resolveBrochureFile(
  key: string,
  revision: string,
  projectSlug: string,
  environment: BrochureEnvironment,
  verifyCompleteFile: boolean,
): Promise<{ brochure: ApprovedBrochure; handle: FileHandle }> {
  let handle: FileHandle | undefined;
  try {
    if (environment.BROCHURE_EMAIL_ENABLED !== "true" ||
      ![key, revision, projectSlug].every(isBrochureIdentifier)) throw new BrochureUnavailableError();
    const rootSetting = environment.BROCHURE_FILES_ROOT;
    const catalogSetting = environment.BROCHURE_CATALOG_PATH;
    if (!rootSetting || !catalogSetting ||
      !path.isAbsolute(rootSetting) || !path.isAbsolute(catalogSetting)) throw new BrochureUnavailableError();
    const [root, catalogPath] = await Promise.all([realpath(rootSetting), realpath(catalogSetting)]);
    // Private PDFs must never be served from Next's public directory.
    const publicRoot = await realpath(path.resolve(process.cwd(), "public")).catch((error: unknown) => {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        return path.resolve(process.cwd(), "public");
      }
      throw error;
    });
    if (root === publicRoot || inside(publicRoot, root) || inside(publicRoot, catalogPath)) throw new BrochureUnavailableError();
    const catalogStat = await stat(catalogPath);
    if (!catalogStat.isFile() || catalogStat.size > 1_048_576) throw new BrochureUnavailableError();
    const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
    if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.entries) || catalog.entries.length > 1000) {
      throw new BrochureUnavailableError();
    }
    const matches = catalog.entries.filter((entry: Record<string, unknown>) =>
      entry?.key === key && entry?.revision === revision);
    if (matches.length !== 1) throw new BrochureUnavailableError();
    const entry = matches[0];
    if (entry.approved !== true || !safeFilename(entry.filename) ||
      typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
      !Array.isArray(entry.propertySlugs) || entry.propertySlugs.length === 0 ||
      !entry.propertySlugs.every(isBrochureIdentifier) || !entry.propertySlugs.includes(projectSlug)) {
      throw new BrochureUnavailableError();
    }
    const filePath = await realpath(path.join(root, entry.filename));
    if (!inside(root, filePath)) throw new BrochureUnavailableError();
    handle = await open(filePath, "r");
    const fileStat = await handle.stat();
    if (!fileStat.isFile() || fileStat.size < 5 || fileStat.size > 250 * 1024 * 1024) {
      throw new BrochureUnavailableError();
    }
    const header = Buffer.alloc(5);
    await handle.read(header, 0, 5, 0);
    if (header.toString("ascii") !== "%PDF-") throw new BrochureUnavailableError();
    if (verifyCompleteFile) {
      const hash = createHash("sha256");
      for await (const chunk of handle.createReadStream({ autoClose: false, start: 0 })) hash.update(chunk);
      if (hash.digest("hex") !== entry.sha256) throw new BrochureUnavailableError();
    }
    return {
      brochure: {
        key, revision, filename: entry.filename, sha256: entry.sha256,
        propertySlugs: entry.propertySlugs, filePath, sizeBytes: fileStat.size,
      },
      handle,
    };
  } catch (error) {
    await handle?.close().catch(() => undefined);
    throw storageFailure(error);
  }
}

/** Opens and verifies the same descriptor that the download route will stream. */
export async function openApprovedBrochure(
  key: string,
  revision: string,
  projectSlug: string,
  environment: BrochureEnvironment = process.env,
): Promise<{ brochure: ApprovedBrochure; handle: FileHandle }> {
  return resolveBrochureFile(key, revision, projectSlug, environment, true);
}

/**
 * Cheap intake preflight before the transactional rate limit. Verifies approval,
 * mapping, private path and PDF signature, but does not certify the entire file.
 * Delivery must call getApprovedBrochure and downloads openApprovedBrochure:
 * neither will email a link or serve a PDF whose full hash has not been verified.
 */
export async function getApprovedBrochureMetadata(
  key: string,
  revision: string,
  projectSlug: string,
  environment: BrochureEnvironment = process.env,
): Promise<ApprovedBrochure> {
  const { brochure, handle } = await resolveBrochureFile(key, revision, projectSlug, environment, false);
  try { await handle.close(); } catch (error) { throw storageFailure(error); }
  return brochure;
}

export async function getApprovedBrochure(
  key: string,
  revision: string,
  projectSlug: string,
  environment: BrochureEnvironment = process.env,
): Promise<ApprovedBrochure> {
  const { brochure, handle } = await openApprovedBrochure(key, revision, projectSlug, environment);
  try { await handle.close(); } catch (error) { throw storageFailure(error); }
  return brochure;
}
