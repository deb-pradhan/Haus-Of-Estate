import { createHash } from "node:crypto";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";
import { createBrochureDownloadUrl } from "../../../../lib/brochures/links";

let directory: string;
let token: string;
const pdf = Buffer.from("%PDF-1.4\nsynthetic download test only\n%%EOF");
const hash = createHash("sha256").update(pdf).digest("hex");

beforeEach(async () => {
  directory = await mkdtemp(path.join(os.tmpdir(), "haus-download-unit-"));
  await mkdir(path.join(directory, "files"));
  await writeFile(path.join(directory, "files", "test.pdf"), pdf);
  await writeFile(path.join(directory, "catalog.json"), JSON.stringify({
    schemaVersion: 1, entries: [{
      key: "test-brochure", revision: hash, filename: "test.pdf", sha256: hash,
      propertySlugs: ["test-property"], approved: true,
    }],
  }));
  for (const [name, value] of Object.entries({
    BROCHURE_EMAIL_ENABLED: "true", BROCHURE_FILES_ROOT: path.join(directory, "files"),
    BROCHURE_CATALOG_PATH: path.join(directory, "catalog.json"),
    BROCHURE_LINK_SECRET: "synthetic-download-test-secret-only",
    BROCHURE_PUBLIC_ORIGIN: "https://hausofestate.com",
  })) vi.stubEnv(name, value);
  token = new URL(createBrochureDownloadUrl({
    key: "test-brochure", revision: hash, projectSlug: "test-property", projectTitle: "Test",
  }, "event-123", new Date())).pathname.split("/").at(-1)!;
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(directory, { recursive: true, force: true });
});

describe("private brochure download", () => {
  it("streams only the verified PDF with private attachment headers", async () => {
    const response = await GET(new Request("https://hausofestate.com"), { params: Promise.resolve({ token }) });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toBe('attachment; filename="test.pdf"');
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(pdf);
  });
  it("revokes existing links when delivery is disabled or approval is removed", async () => {
    vi.stubEnv("BROCHURE_EMAIL_ENABLED", "false");
    expect((await GET(new Request("https://hausofestate.com"), { params: Promise.resolve({ token }) })).status).toBe(404);
    vi.stubEnv("BROCHURE_EMAIL_ENABLED", "true");
    await writeFile(path.join(directory, "catalog.json"), JSON.stringify({ schemaVersion: 1, entries: [] }));
    const response = await GET(new Request("https://hausofestate.com"), { params: Promise.resolve({ token }) });
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(directory);
  });
  it("does not reveal file or configuration details for invalid links", async () => {
    const response = await GET(new Request("https://hausofestate.com"), { params: Promise.resolve({ token: "../../catalog.json" }) });
    expect(response.status).toBe(404);
    expect(await response.text()).toBe("This brochure link is unavailable or has expired. Please request a new brochure.");
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
