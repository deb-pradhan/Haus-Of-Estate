import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getApprovedBrochure, getApprovedBrochureMetadata } from "./catalog";
import { createBrochureDownloadUrl, verifyBrochureDownloadToken } from "./links";

const storage = vi.hoisted(() => ({ failure: undefined as NodeJS.ErrnoException | undefined }));
vi.mock("node:fs/promises", async (original) => {
  const actual = await original<typeof import("node:fs/promises")>();
  return {
    ...actual,
    open: (...args: Parameters<typeof actual.open>) => storage.failure
      ? Promise.reject(storage.failure)
      : actual.open(...args),
  };
});

const pdf = Buffer.from("%PDF-1.4\nsynthetic brochure test only\n%%EOF");
const hash = createHash("sha256").update(pdf).digest("hex");
const selection = { key: "villa-4br", revision: hash, projectSlug: "florence-villas", projectTitle: "Test villas" };
let directory: string;
let environment: NodeJS.ProcessEnv;
let entry: Record<string, unknown>;

async function saveEntry() {
  await writeFile(environment.BROCHURE_CATALOG_PATH!, JSON.stringify({ schemaVersion: 1, entries: [entry] }));
}

beforeEach(async () => {
  storage.failure = undefined;
  directory = await mkdtemp(path.join(os.tmpdir(), "haus-brochure-unit-"));
  const root = path.join(directory, "files");
  await mkdir(root);
  environment = {
    NODE_ENV: "test", BROCHURE_EMAIL_ENABLED: "true", BROCHURE_FILES_ROOT: root,
    BROCHURE_CATALOG_PATH: path.join(directory, "catalog.json"),
    BROCHURE_LINK_SECRET: "synthetic-test-secret-not-for-production",
    BROCHURE_PUBLIC_ORIGIN: "http://localhost:3018",
  };
  entry = {
    key: selection.key, revision: hash, filename: "villa.pdf", sha256: hash,
    propertySlugs: [selection.projectSlug], approved: true,
  };
  await writeFile(path.join(root, "villa.pdf"), pdf);
  await saveEntry();
});
afterEach(async () => {
  storage.failure = undefined;
  await rm(directory, { recursive: true, force: true });
});

describe("private brochure catalogue", () => {
  it.each(["EIO", "EMFILE", "ENFILE", "EAGAIN", "EBUSY", "ETIMEDOUT"])(
    "preserves only the safe retry classification for storage failure %s", async (code) => {
      storage.failure = Object.assign(new Error("sensitive/private/path"), { code });
      await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment))
        .rejects.toMatchObject({ name: "BrochureStorageError", message: "Brochure unavailable" });
    },
  );
  it.each(["ENOENT", "EACCES", "EINVAL"])("does not retry missing or invalid storage configuration %s", async (code) => {
    storage.failure = Object.assign(new Error("sensitive/private/path"), { code });
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment))
      .rejects.toMatchObject({ name: "BrochureUnavailableError", message: "Brochure unavailable" });
  });
  it("verifies the exact source bytes, property mapping and approved revision", async () => {
    const brochure = await getApprovedBrochure(selection.key, hash, selection.projectSlug, environment);
    expect(brochure.sizeBytes).toBe(pdf.length);
    expect(await readFile(brochure.filePath)).toEqual(pdf);
  });
  it("fails closed for disabled delivery, unapproved files, unknown properties and revisions", async () => {
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, { ...environment, BROCHURE_EMAIL_ENABLED: "false" }))
      .rejects.toThrow("Brochure unavailable");
    await expect(getApprovedBrochure(selection.key, hash, "other-property", environment)).rejects.toThrow("Brochure unavailable");
    await expect(getApprovedBrochure(selection.key, "old-revision", selection.projectSlug, environment)).rejects.toThrow("Brochure unavailable");
    entry.approved = false;
    await saveEntry();
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment)).rejects.toThrow("Brochure unavailable");
  });
  it("rejects tampered PDFs and path traversal without leaking private paths", async () => {
    await writeFile(path.join(environment.BROCHURE_FILES_ROOT!, "villa.pdf"), Buffer.from("%PDF-edited"));
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment)).rejects.toThrow(/^Brochure unavailable$/);
    entry.filename = "../outside.pdf";
    await saveEntry();
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment)).rejects.toThrow(/^Brochure unavailable$/);
  });
  it("does a cheap intake preflight but fully verifies bytes before delivery", async () => {
    await writeFile(path.join(environment.BROCHURE_FILES_ROOT!, "villa.pdf"), Buffer.from("%PDF-edited-source"));
    await expect(getApprovedBrochureMetadata(selection.key, hash, selection.projectSlug, environment))
      .resolves.toMatchObject({ key: selection.key, revision: hash });
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, environment))
      .rejects.toThrow("Brochure unavailable");
    entry.approved = false;
    await saveEntry();
    await expect(getApprovedBrochureMetadata(selection.key, hash, selection.projectSlug, environment))
      .rejects.toThrow("Brochure unavailable");
  });
  it("rejects a real-path escape through a directory link", async () => {
    const outside = path.join(directory, "outside");
    await mkdir(outside);
    await writeFile(path.join(outside, "villa.pdf"), pdf);
    const linkedRoot = path.join(directory, "linked");
    await mkdir(linkedRoot);
    // Junctions work without elevated symlink privileges on Windows.
    await symlink(outside, path.join(linkedRoot, "escape"), "junction");
    entry.filename = "escape/villa.pdf";
    await saveEntry();
    await expect(getApprovedBrochure(selection.key, hash, selection.projectSlug, { ...environment, BROCHURE_FILES_ROOT: linkedRoot }))
      .rejects.toThrow("Brochure unavailable");
  });
});

describe("signed brochure links", () => {
  const createdAt = new Date("2026-10-20T12:00:00Z");
  const token = (url: string) => new URL(url).pathname.split("/").at(-1)!;
  it.each([0, 1, 30, 60])("allows %s seconds of creation clock skew without extending expiry", (skewSeconds) => {
    const futureCreation = new Date(createdAt.getTime() + skewSeconds * 1_000);
    const signed = token(createBrochureDownloadUrl(selection, "clock-test", futureCreation, environment));
    const expiresAt = new Date(futureCreation.getTime() + 7 * 24 * 60 * 60 * 1_000);
    expect(verifyBrochureDownloadToken(signed, environment, createdAt).expiresAt).toEqual(expiresAt);
    expect(() => verifyBrochureDownloadToken(signed, environment, expiresAt)).toThrow("Brochure unavailable");
  });
  it("rejects a future timestamp beyond the delivery clock tolerance", () => {
    const futureCreation = new Date(createdAt.getTime() + 61_000);
    const signed = token(createBrochureDownloadUrl(selection, "clock-test", futureCreation, environment));
    expect(() => verifyBrochureDownloadToken(signed, environment, createdAt)).toThrow("Brochure unavailable");
  });
  it("is deterministic across retries, expires in seven days and contains no customer identity", () => {
    const first = createBrochureDownloadUrl(selection, "event-person@example.test", createdAt, environment);
    expect(first).toBe(createBrochureDownloadUrl(selection, "event-person@example.test", createdAt, environment));
    expect(Buffer.from(token(first).split(".")[0], "base64url").toString()).not.toContain("@");
    expect(verifyBrochureDownloadToken(token(first), environment, createdAt)).toMatchObject({
      key: selection.key, revision: hash, projectSlug: selection.projectSlug,
      expiresAt: new Date("2026-10-27T12:00:00Z"),
    });
    expect(() => verifyBrochureDownloadToken(token(first), environment, new Date("2026-10-27T12:00:00Z"))).toThrow("Brochure unavailable");
  });
  it("rejects altered claims, altered signatures, malformed tokens and secret rotation", () => {
    const original = token(createBrochureDownloadUrl(selection, "event-123", createdAt, environment));
    const [payload, signature] = original.split(".");
    const alteredPayload = Buffer.from(Buffer.from(payload, "base64url").toString().replace("villa-4br", "villa-5br")).toString("base64url");
    for (const candidate of [`${alteredPayload}.${signature}`, `${payload}.${"a".repeat(43)}`, "garbage"]) {
      expect(() => verifyBrochureDownloadToken(candidate, environment, createdAt)).toThrow("Brochure unavailable");
    }
    expect(() => verifyBrochureDownloadToken(original, { ...environment, BROCHURE_LINK_SECRET: "rotated-test-secret-now-invalidates-links" }, createdAt))
      .toThrow("Brochure unavailable");
  });
  it("requires HTTPS in production, an explicit private secret and enabled delivery", () => {
    for (const settings of [
      { NODE_ENV: "production" }, { BROCHURE_LINK_SECRET: "short" }, { BROCHURE_EMAIL_ENABLED: "false" },
      { BROCHURE_PUBLIC_ORIGIN: "https://example.test/path" }, { BROCHURE_PUBLIC_ORIGIN: "https://user:pass@example.test" },
    ]) {
      expect(() => createBrochureDownloadUrl(selection, "event", createdAt, { ...environment, ...settings })).toThrow("Brochure unavailable");
    }
    expect(createBrochureDownloadUrl(selection, "event", createdAt, {
      ...environment, NODE_ENV: "production", BROCHURE_PUBLIC_ORIGIN: "https://hausofestate.com",
    })).toMatch(/^https:\/\/hausofestate.com\/api\/brochures\//);
  });
});
