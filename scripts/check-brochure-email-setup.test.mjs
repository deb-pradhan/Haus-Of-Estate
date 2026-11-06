import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { checkBrochureEmailSetup, preflightExitCode } from "./check-brochure-email-setup.mjs";

const baseEnvironment = {
  NODE_ENV: "production", LEAD_INTAKE_ENABLED: "true", LEAD_DELIVERY_ENABLED: "true",
  BROCHURE_EMAIL_ENABLED: "true", LEAD_NOTIFICATIONS_ENABLED: "true", RESEND_WEBHOOK_ENABLED: "true",
  DATABASE_URL: "postgresql://synthetic:do-not-print-db-password@hosted.example.invalid/haus-test",
  LEAD_RATE_LIMIT_SECRET: "do-not-print-rate-secret", RESEND_API_KEY: "re_synthetic_do_not_print",
  RESEND_FROM_EMAIL: "synthetic-sender@hausofestate.com", BROCHURE_REPLY_TO: "synthetic-reply@hausofestate.com",
  LEAD_NOTIFICATION_TO: "synthetic-staff@hausofestate.com", LEAD_DELIVERY_PROVIDER: "resend",
  BROCHURE_PUBLIC_ORIGIN: "https://preview.example.invalid", BROCHURE_LINK_SECRET: "synthetic-link-secret-that-is-long-enough",
  RESEND_WEBHOOK_SECRET: "whsec_synthetic_do_not_print",
};
const stage = (report, name) => report.stages.find((item) => item.stage === name);

async function fixture(run) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "haus-mail-preflight-"));
  const root = path.join(directory, "private");
  await mkdir(root);
  const pdf = Buffer.from("%PDF-1.4\nSynthetic brochure only\n%%EOF");
  const entry = { key: "synthetic-brochure", revision: "r1", filename: "synthetic.pdf", sha256: createHash("sha256").update(pdf).digest("hex"), propertySlugs: ["synthetic-property"], approved: true };
  const catalogPath = path.join(directory, "catalog.json");
  const catalog = { schemaVersion: 1, entries: [entry] };
  await writeFile(catalogPath, JSON.stringify(catalog));
  const environment = { ...baseEnvironment, BROCHURE_FILES_ROOT: root, BROCHURE_CATALOG_PATH: catalogPath };
  try { await run({ directory, root, pdf, entry, catalog, catalogPath, environment }); }
  finally {
    // Remove only the unique synthetic directory created by this fixture.
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("haus-mail-preflight-"));
    await rm(directory, { recursive: true, force: true });
  }
}

test("disabled features stay disabled without credentials; exit zero is not delivery readiness", async () => {
  const report = await checkBrochureEmailSetup({});
  assert.equal(preflightExitCode(report), 0);
  assert.ok(report.stages.every((item) => ["disabled", "not_requested"].includes(item.status)));
  assert.equal(report.liveDeliveryVerified, false);
  assert.match(report.databaseBoundary, /HOSTED_DATABASE_REQUIRED_NO_LOCAL_POSTGRES/);
  assert.match(report.activation, /DISABLED_FEATURES_REMAIN_DISABLED/);
});

test("enabled but missing settings block their stages without throwing raw errors", async () => {
  const report = await checkBrochureEmailSetup({ NODE_ENV: "production", LEAD_INTAKE_ENABLED: "true", BROCHURE_EMAIL_ENABLED: "true", RESEND_WEBHOOK_ENABLED: "true" });
  assert.equal(preflightExitCode(report), 1);
  assert.deepEqual(stage(report, "native_intake").reasons, ["DATABASE_URL_MISSING", "LEAD_RATE_LIMIT_SECRET_MISSING"]);
  assert.ok(stage(report, "brochure_email").reasons.includes("LEAD_DELIVERY_ENABLED_REQUIRED"));
  assert.ok(stage(report, "resend_webhook").reasons.includes("RESEND_WEBHOOK_SECRET_MISSING"));
});

test("runtime-specific flags and the delivery master gate remain authoritative", async () => fixture(async ({ environment }) => {
  let report = await checkBrochureEmailSetup({ ...environment, BROCHURE_EMAIL_ENABLED: "TRUE" });
  assert.deepEqual(stage(report, "brochure_email").reasons, ["FLAG_VALUE_NOT_ACCEPTED_BY_RUNTIME"]);
  report = await checkBrochureEmailSetup({ ...environment, LEAD_DELIVERY_ENABLED: "false" });
  assert.equal(stage(report, "outbox").status, "disabled");
  assert.equal(stage(report, "brochure_email").status, "blocked");
  assert.equal(stage(report, "staff_notification").status, "blocked");
}));

test("valid metadata needs no PDF reads and cannot claim receipt or mapping publication", async () => fixture(async ({ environment }) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("A preflight must not call network services"); };
  try {
    const report = await checkBrochureEmailSetup(environment);
    assert.equal(preflightExitCode(report), 0);
    assert.equal(stage(report, "brochure_email").status, "configuration_valid");
    assert.equal(report.fileVerification, "PDF_CONTENT_AND_HASHES_NOT_CHECKED");
    assert.equal(report.liveDeliveryVerified, false);
    assert.ok(report.stillUnverified.includes("PUBLISHED_PROPERTY_AND_DESIGN_BROCHURE_MAPPING_APPROVAL"));
  } finally { globalThis.fetch = originalFetch; }
}));

test("unapproved and duplicate catalog mappings are blocked", async () => fixture(async ({ environment, catalog, catalogPath }) => {
  catalog.entries[0].approved = false;
  await writeFile(catalogPath, JSON.stringify(catalog));
  let report = await checkBrochureEmailSetup(environment);
  assert.ok(stage(report, "brochure_email").reasons.includes("NO_APPROVED_BROCHURE_MAPPINGS"));
  catalog.entries.push({ ...catalog.entries[0], approved: true });
  await writeFile(catalogPath, JSON.stringify(catalog));
  report = await checkBrochureEmailSetup(environment);
  assert.ok(stage(report, "brochure_email").reasons.includes("CATALOG_DUPLICATE_REVISION"));
}));

test("catalog traversal, public storage and oversized metadata are rejected", async () => fixture(async ({ environment, catalog, catalogPath }) => {
  catalog.entries[0].filename = "../private.pdf";
  await writeFile(catalogPath, JSON.stringify(catalog));
  let report = await checkBrochureEmailSetup(environment);
  assert.ok(stage(report, "brochure_email").reasons.includes("CATALOG_ENTRY_OR_MAPPING_INVALID"));
  report = await checkBrochureEmailSetup({ ...environment, BROCHURE_FILES_ROOT: path.resolve("public") });
  assert.ok(stage(report, "brochure_email").reasons.includes("PRIVATE_CATALOG_LOCATION_INVALID"));
  await writeFile(catalogPath, " ".repeat(1_048_577));
  report = await checkBrochureEmailSetup(environment);
  assert.ok(stage(report, "brochure_email").reasons.includes("CATALOG_SIZE_OR_TYPE_INVALID"));
}));

test("explicit file checks enforce the existing PDF integrity verifier", async () => fixture(async ({ environment, root, pdf, entry }) => {
  let report = await checkBrochureEmailSetup(environment, { checkFiles: true });
  assert.equal(stage(report, "brochure_email").status, "blocked");
  await writeFile(path.join(root, entry.filename), "%PDF-wrong-content");
  report = await checkBrochureEmailSetup(environment, { checkFiles: true });
  assert.equal(stage(report, "brochure_email").status, "blocked");
  await writeFile(path.join(root, entry.filename), pdf);
  report = await checkBrochureEmailSetup(environment, { checkFiles: true });
  assert.equal(stage(report, "brochure_email").status, "configuration_valid");
  assert.equal(report.liveDeliveryVerified, false);
}));

test("local database URLs are rejected without making a connection", async () => fixture(async ({ environment }) => {
  for (const host of ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"]) {
    const report = await checkBrochureEmailSetup({ ...environment, DATABASE_URL: `postgresql://synthetic@${host}/never-connect` });
    assert.ok(stage(report, "native_intake").reasons.includes("HOSTED_DATABASE_REQUIRED_LOCAL_POSTGRES_NOT_ALLOWED"));
    assert.equal(stage(report, "outbox").status, "blocked");
    assert.equal(stage(report, "resend_webhook").status, "blocked");
  }
}));

test("reports never contain credentials, mailboxes, paths, URLs or catalog contents", async () => fixture(async ({ environment, directory, catalogPath, entry }) => {
  const bad = { ...environment, LEAD_SHEETS_ENABLED: "true", LEAD_GOOGLE_SERVICE_ACCOUNT_JSON: "not-json-private-material", LEAD_SHEETS_SPREADSHEET_ID: "private-spreadsheet-id", LEAD_SHEETS_TAB_NAME: "private-tab-name" };
  await writeFile(catalogPath, `broken-json ${directory} ${environment.RESEND_API_KEY}`);
  const report = await checkBrochureEmailSetup(bad);
  assert.equal(stage(report, "google_sheets").status, "blocked");
  const text = JSON.stringify(report);
  for (const secret of [directory, entry.key, entry.filename, ...Object.entries(bad).filter(([key]) => !key.endsWith("ENABLED") && !["NODE_ENV", "LEAD_DELIVERY_PROVIDER"].includes(key)).map(([, value]) => value)]) assert.equal(text.includes(secret), false);
}));

test("CLI explicit env file is redacted and input failures do not echo paths", async () => fixture(async ({ directory }) => {
  const envFile = path.join(directory, "secret-settings.env");
  await writeFile(envFile, "LEAD_INTAKE_ENABLED=false\nBROCHURE_EMAIL_ENABLED=false\nRESEND_API_KEY=re_do_not_print_cli\n");
  const script = path.resolve("scripts/check-brochure-email-setup.mjs");
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(LEAD_|BROCHURE_|RESEND_|NODE_OPTIONS$)/.test(key)));
  let result = spawnSync(process.execPath, ["--import", "tsx", script, "--settings-file", envFile], { encoding: "utf8", env: environment });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).liveDeliveryVerified, false);
  assert.equal(result.stdout.includes("re_do_not_print_cli"), false);
  assert.equal(result.stdout.includes(directory), false);
  result = spawnSync(process.execPath, ["--import", "tsx", script, "--settings-file", path.join(directory, "missing-secret-file")], { encoding: "utf8", env: environment });
  assert.equal(result.status, 2);
  assert.equal(result.stderr.includes(directory), false);
  assert.equal(result.stderr.includes("missing-secret-file"), false);
}));

const disabledGates = {
  LEAD_INTAKE_ENABLED: "false", LEAD_DELIVERY_ENABLED: "false", BROCHURE_EMAIL_ENABLED: "false",
  LEAD_NOTIFICATIONS_ENABLED: "false", RESEND_WEBHOOK_ENABLED: "false", LEAD_SHEETS_ENABLED: "false",
};

test("brochure profile exposes missing rollout configuration while every current gate is disabled", async () => {
  const report = await checkBrochureEmailSetup(Object.freeze({ ...disabledGates }), { profile: "brochure" });
  assert.equal(preflightExitCode(report), 1);
  assert.equal(report.profile, "brochure");
  assert.equal(report.stages.length, 6);
  assert.ok(report.stages.every((item) => item.status === "blocked"));
  assert.ok(report.stages.filter((item) => item.stage !== "resend_sender").every((item) => item.currentGate === "disabled"));
  assert.deepEqual(stage(report, "native_intake").missingKeys, ["DATABASE_URL", "LEAD_RATE_LIMIT_SECRET"]);
  assert.deepEqual(stage(report, "resend_sender").missingKeys, ["RESEND_API_KEY", "RESEND_FROM_EMAIL"]);
  assert.ok(stage(report, "brochure_email").missingKeys.includes("BROCHURE_CATALOG_PATH"));
  assert.ok(stage(report, "brochure_email").missingKeys.includes("BROCHURE_FILES_ROOT"));
  assert.ok(stage(report, "brochure_email").reasons.includes("PRIVATE_CATALOG_ABSOLUTE_PATHS_REQUIRED"));
  assert.deepEqual(stage(report, "staff_notification").missingKeys, ["LEAD_DELIVERY_PROVIDER", "LEAD_NOTIFICATION_TO"]);
  assert.deepEqual(stage(report, "resend_webhook").missingKeys, ["RESEND_WEBHOOK_SECRET", "DATABASE_URL"]);
  assert.equal(stage(report, "google_sheets"), undefined);
});

test("brochure profile validates complete configuration with gates off without mutation or network access", async () => fixture(async ({ environment }) => {
  const input = Object.freeze({ ...environment, ...disabledGates });
  const before = { ...input };
  const processBefore = Object.fromEntries(Object.keys(disabledGates).map((key) => [key, process.env[key]]));
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("The profile must not contact a service"); };
  try {
    const report = await checkBrochureEmailSetup(input, { profile: "brochure" });
    assert.equal(preflightExitCode(report), 0);
    assert.ok(report.stages.every((item) => item.status === "configuration_valid" && item.missingKeys.length === 0));
    assert.ok(report.stages.filter((item) => item.stage !== "resend_sender").every((item) => item.currentGate === "disabled"));
    assert.equal(report.liveDeliveryVerified, false);
    assert.equal(report.fileVerification, "PDF_CONTENT_AND_HASHES_NOT_CHECKED");
    assert.match(report.activation, /DISABLED_FEATURES_REMAIN_DISABLED/);
    assert.match(report.privateApprovalVerification, /PUBLISHED_MAPPING_APPROVAL_NOT_CHECKED/);
    assert.deepEqual(input, before);
    assert.deepEqual(Object.fromEntries(Object.keys(disabledGates).map((key) => [key, process.env[key]])), processBefore);
  } finally { globalThis.fetch = originalFetch; }
}));

test("brochure profile requires private approvals and performs opt-in PDF checks with gates off", async () => fixture(async ({ environment, catalog, catalogPath, root, pdf, entry }) => {
  const input = { ...environment, ...disabledGates };
  catalog.entries[0].approved = false;
  await writeFile(catalogPath, JSON.stringify(catalog));
  let report = await checkBrochureEmailSetup(input, { profile: "brochure" });
  assert.ok(stage(report, "brochure_email").reasons.includes("NO_APPROVED_BROCHURE_MAPPINGS"));
  assert.equal(stage(report, "brochure_email").currentGate, "disabled");
  catalog.entries[0].approved = true;
  await writeFile(catalogPath, JSON.stringify(catalog));
  report = await checkBrochureEmailSetup(input, { profile: "brochure", checkFiles: true });
  assert.equal(preflightExitCode(report), 1);
  assert.ok(stage(report, "brochure_email").reasons.includes("CATALOG_OR_APPROVED_FILES_UNAVAILABLE"));
  await writeFile(path.join(root, entry.filename), pdf);
  report = await checkBrochureEmailSetup(input, { profile: "brochure", checkFiles: true });
  assert.equal(preflightExitCode(report), 0);
  assert.equal(report.fileVerification, "APPROVED_FILE_CHECKS_REQUESTED_SEE_BROCHURE_STAGE");
  assert.equal(input.BROCHURE_EMAIL_ENABLED, "false");
}));

test("brochure profile enforces hosted rollout requirements even with development settings", async () => fixture(async ({ environment }) => {
  const input = { ...environment, ...disabledGates, NODE_ENV: "development", LEAD_RATE_LIMIT_SECRET: "", BROCHURE_PUBLIC_ORIGIN: "http://localhost:3000", DATABASE_URL: "postgresql://synthetic@localhost/test" };
  const report = await checkBrochureEmailSetup(input, { profile: "brochure" });
  assert.ok(stage(report, "native_intake").reasons.includes("LEAD_RATE_LIMIT_SECRET_MISSING"));
  assert.ok(stage(report, "native_intake").reasons.includes("HOSTED_DATABASE_REQUIRED_LOCAL_POSTGRES_NOT_ALLOWED"));
  assert.ok(stage(report, "brochure_email").reasons.includes("BROCHURE_EMAIL_SETTINGS_MISSING_OR_INVALID"));
  assert.equal(preflightExitCode(report), 1);
}));

test("brochure profile does not conceal rejected current flags or a different staff provider", async () => fixture(async ({ environment }) => {
  let report = await checkBrochureEmailSetup({ ...environment, ...disabledGates, BROCHURE_EMAIL_ENABLED: "TRUE", RESEND_WEBHOOK_ENABLED: " true " }, { profile: "brochure" });
  for (const name of ["brochure_email", "resend_webhook"]) {
    assert.equal(stage(report, name).currentGate, "invalid");
    assert.equal(stage(report, name).status, "blocked");
    assert.ok(stage(report, name).reasons.includes("FLAG_VALUE_NOT_ACCEPTED_BY_RUNTIME"));
  }
  report = await checkBrochureEmailSetup({ ...environment, ...disabledGates, LEAD_DELIVERY_PROVIDER: "powerautomate" }, { profile: "brochure" });
  assert.equal(stage(report, "staff_notification").status, "blocked");
  assert.ok(stage(report, "staff_notification").reasons.includes("RESEND_STAFF_PROVIDER_REQUIRED_FOR_BROCHURE_PROFILE"));
  report = await checkBrochureEmailSetup({ ...environment, ...disabledGates, RESEND_FROM_EMAIL: "" }, { profile: "brochure" });
  assert.deepEqual(stage(report, "resend_sender").missingKeys, ["RESEND_FROM_EMAIL"]);
  assert.equal(stage(report, "resend_sender").status, "blocked");
}));

test("brochure profile includes optional Sheets only when currently enabled", async () => fixture(async ({ environment }) => {
  let report = await checkBrochureEmailSetup({ ...environment, ...disabledGates }, { profile: "brochure" });
  assert.equal(stage(report, "google_sheets"), undefined);
  assert.equal(report.stillUnverified.includes("OPTIONAL_SHEETS_ACCESS_HEADERS_AND_ROW_RECEIPT"), false);
  report = await checkBrochureEmailSetup({ ...environment, ...disabledGates, LEAD_SHEETS_ENABLED: "true" }, { profile: "brochure" });
  assert.equal(stage(report, "google_sheets").currentGate, "enabled");
  assert.equal(stage(report, "google_sheets").requiredForProfile, false);
  assert.equal(stage(report, "google_sheets").status, "blocked");
  assert.deepEqual(stage(report, "google_sheets").missingKeys, ["LEAD_SHEETS_SPREADSHEET_ID", "LEAD_SHEETS_TAB_NAME", "LEAD_GOOGLE_SERVICE_ACCOUNT_JSON"]);
  assert.equal(report.stillUnverified.includes("OPTIONAL_SHEETS_ACCESS_HEADERS_AND_ROW_RECEIPT"), true);
}));

test("brochure profile output never includes secret settings, paths or catalogue contents", async () => fixture(async ({ environment, directory, entry }) => {
  const input = { ...environment, ...disabledGates };
  const text = JSON.stringify(await checkBrochureEmailSetup(input, { profile: "brochure" }));
  for (const value of [directory, entry.key, entry.filename, ...Object.entries(input).filter(([key]) => !key.endsWith("ENABLED") && !["NODE_ENV", "LEAD_DELIVERY_PROVIDER"].includes(key)).map(([, value]) => value)]) assert.equal(text.includes(value), false);
}));

test("CLI profile is explicit, preserves default behavior and rejects unsupported inputs without echoing them", async () => fixture(async ({ directory }) => {
  const script = path.resolve("scripts/check-brochure-email-setup.mjs");
  const environment = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(LEAD_|BROCHURE_|RESEND_|DATABASE_URL$|NODE_OPTIONS$)/.test(key)));
  let result = spawnSync(process.execPath, ["--import", "tsx", script, "--profile", "brochure"], { encoding: "utf8", env: environment });
  assert.equal(result.status, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).profile, "brochure");
  assert.equal(stage(JSON.parse(result.stdout), "brochure_email").currentGate, "disabled");
  assert.equal(result.stdout.includes(directory), false);
  result = spawnSync(process.execPath, ["--import", "tsx", script], { encoding: "utf8", env: environment });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).profile, undefined);
  for (const args of [["--profile"], ["--profile", "private-invalid-profile"], ["--profile", "brochure", "--profile", "brochure"]]) {
    result = spawnSync(process.execPath, ["--import", "tsx", script, ...args], { encoding: "utf8", env: environment });
    assert.equal(result.status, 2);
    assert.equal(result.stderr.includes("private-invalid-profile"), false);
  }
  await assert.rejects(checkBrochureEmailSetup({}, { profile: "unknown" }), /Unsupported configuration profile/);
}));
