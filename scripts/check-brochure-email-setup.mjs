import { open, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isLeadIntakeEnabled, isLeadIntakeReady } from "../src/lib/lead-intake/security.ts";
import { isLeadDeliveryEnabled, isLeadNotificationEnabled, readLeadDeliveryProvider, readPowerAutomateConfig, readZeptoMailConfig } from "../src/lib/lead-delivery/config.ts";
import { readResendSettings } from "../src/lib/email/resend-settings.ts";
import { readResendLeadConfig } from "../src/lib/lead-delivery/resend-config.ts";
import { isGoogleSheetsDeliveryEnabled, readGoogleSheetsLeadConfig } from "../src/lib/lead-delivery/google-sheets-config.ts";
import { readBrochureEmailConfig } from "../src/lib/lead-delivery/brochure.ts";
import { getApprovedBrochure, isBrochureIdentifier } from "../src/lib/brochures/catalog.ts";

const MAX_METADATA_BYTES = 1_048_576;
const MAX_FILE_CHECKS = 20;
const BROCHURE_KEYS = ["BROCHURE_EMAIL_ENABLED", "BROCHURE_REPLY_TO", "BROCHURE_LINK_SECRET", "BROCHURE_PUBLIC_ORIGIN", "BROCHURE_CATALOG_PATH", "BROCHURE_FILES_ROOT"];
const SENDER_KEYS = ["RESEND_API_KEY", "RESEND_FROM_EMAIL"];
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
};

function validConfig(read, environment) {
  try { read(environment); return true; } catch { return false; }
}

function gateState(environment, flag, enabled) {
  if (enabled) return "enabled";
  const raw = environment[flag];
  return !raw?.trim() || raw.trim().toLowerCase() === "false" ? "disabled" : "invalid";
}

// A URL inspection only: this script never creates a database client.
function databaseReason(environment) {
  if (!environment.DATABASE_URL?.trim()) return "DATABASE_URL_MISSING";
  try {
    const url = new URL(environment.DATABASE_URL);
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || url.searchParams.has("host")) return "DATABASE_URL_INVALID";
    if (["localhost", "[::1]", "[::]", "0.0.0.0", "host.docker.internal"].includes(url.hostname) || /^127\./.test(url.hostname)) return "HOSTED_DATABASE_REQUIRED_LOCAL_POSTGRES_NOT_ALLOWED";
    return null;
  } catch { return "DATABASE_URL_INVALID"; }
}

/** Bounded metadata read. PDF content is read only with explicit --check-files. */
async function checkCatalog(environment, checkFiles) {
  const keys = ["BROCHURE_CATALOG_PATH", "BROCHURE_FILES_ROOT"];
  if (keys.some((key) => !environment[key] || !path.isAbsolute(environment[key]))) return "PRIVATE_CATALOG_ABSOLUTE_PATHS_REQUIRED";
  let handle;
  try {
    const [root, catalogPath, publicRoot] = await Promise.all([
      realpath(environment.BROCHURE_FILES_ROOT), realpath(environment.BROCHURE_CATALOG_PATH),
      realpath(path.resolve("public")).catch(() => path.resolve("public")),
    ]);
    if (inside(publicRoot, root) || inside(publicRoot, catalogPath) || !(await stat(root)).isDirectory()) return "PRIVATE_CATALOG_LOCATION_INVALID";
    handle = await open(catalogPath, "r");
    const info = await handle.stat();
    if (!info.isFile() || info.size > MAX_METADATA_BYTES) return "CATALOG_SIZE_OR_TYPE_INVALID";
    // Bound the actual read as well as stat, even if the file changes concurrently.
    const bytes = Buffer.alloc(MAX_METADATA_BYTES + 1);
    const { bytesRead } = await handle.read(bytes, 0, bytes.length, 0);
    if (bytesRead > MAX_METADATA_BYTES) return "CATALOG_SIZE_OR_TYPE_INVALID";
    const catalog = JSON.parse(bytes.subarray(0, bytesRead).toString("utf8"));
    if (catalog?.schemaVersion !== 1 || !Array.isArray(catalog.entries) || catalog.entries.length > 1000) return "CATALOG_SCHEMA_INVALID";
    const identities = new Set();
    const approved = [];
    for (const entry of catalog.entries) {
      if (!entry || !isBrochureIdentifier(entry.key) || !isBrochureIdentifier(entry.revision) ||
        typeof entry.approved !== "boolean" || typeof entry.filename !== "string" || entry.filename.length > 180 ||
        !/^[a-z0-9][a-z0-9._-]*\.pdf$/i.test(entry.filename) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])\./i.test(entry.filename) ||
        typeof entry.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        !Array.isArray(entry.propertySlugs) || !entry.propertySlugs.length || !entry.propertySlugs.every(isBrochureIdentifier)) return "CATALOG_ENTRY_OR_MAPPING_INVALID";
      const identity = JSON.stringify([entry.key, entry.revision]);
      if (identities.has(identity)) return "CATALOG_DUPLICATE_REVISION";
      identities.add(identity);
      if (entry.approved) approved.push(entry);
    }
    if (!approved.length) return "NO_APPROVED_BROCHURE_MAPPINGS";
    if (checkFiles) {
      if (approved.length > MAX_FILE_CHECKS) return "APPROVED_FILE_CHECK_LIMIT_EXCEEDED";
      for (const entry of approved) await getApprovedBrochure(entry.key, entry.revision, entry.propertySlugs[0], environment);
    }
    return null;
  } catch { return "CATALOG_OR_APPROVED_FILES_UNAVAILABLE"; }
  finally { await handle?.close().catch(() => undefined); }
}

/**
 * Audit the intended hosted brochure rollout without activating any feature.
 * Runtime readers require enabled gates, so validate a separate, temporary object;
 * never assign these values to process.env, the caller's object or a settings file.
 */
async function checkBrochureProfile(environment, checkFiles) {
  const gates = {
    native_intake: ["LEAD_INTAKE_ENABLED", isLeadIntakeEnabled(environment)],
    outbox: ["LEAD_DELIVERY_ENABLED", isLeadDeliveryEnabled(environment)],
    brochure_email: ["BROCHURE_EMAIL_ENABLED", environment.BROCHURE_EMAIL_ENABLED === "true"],
    staff_notification: ["LEAD_NOTIFICATIONS_ENABLED", isLeadNotificationEnabled(environment)],
    resend_webhook: ["RESEND_WEBHOOK_ENABLED", environment.RESEND_WEBHOOK_ENABLED === "true"],
    google_sheets: ["LEAD_SHEETS_ENABLED", isGoogleSheetsDeliveryEnabled(environment)],
  };
  const intended = {
    ...environment,
    NODE_ENV: "production",
    LEAD_INTAKE_ENABLED: "true",
    LEAD_DELIVERY_ENABLED: "true",
    BROCHURE_EMAIL_ENABLED: "true",
    LEAD_NOTIFICATIONS_ENABLED: "true",
    RESEND_WEBHOOK_ENABLED: "true",
    LEAD_DELIVERY_PROVIDER: "resend",
  };
  const report = await checkBrochureEmailSetup(intended, { checkFiles });
  const requiredKeys = {
    native_intake: ["DATABASE_URL", "LEAD_RATE_LIMIT_SECRET"],
    outbox: ["DATABASE_URL"],
    resend_sender: SENDER_KEYS,
    brochure_email: BROCHURE_KEYS.filter((key) => key !== "BROCHURE_EMAIL_ENABLED"),
    staff_notification: ["LEAD_DELIVERY_PROVIDER", "LEAD_NOTIFICATION_TO"],
    resend_webhook: ["RESEND_WEBHOOK_SECRET", "DATABASE_URL"],
    google_sheets: ["LEAD_SHEETS_SPREADSHEET_ID", "LEAD_SHEETS_TAB_NAME", "LEAD_GOOGLE_SERVICE_ACCOUNT_JSON"],
  };
  const sheetsEnabled = gates.google_sheets[1];
  report.stages = report.stages
    .filter((item) => item.stage !== "google_sheets" || sheetsEnabled)
    .map((item) => {
      const gate = gates[item.stage];
      const currentGate = gate ? gateState(environment, ...gate) : "not_applicable";
      const missingKeys = (requiredKeys[item.stage] ?? []).filter((key) => !environment[key]?.trim());
      const problems = [];
      if (currentGate === "invalid") problems.push("FLAG_VALUE_NOT_ACCEPTED_BY_RUNTIME");
      if (missingKeys.length) problems.push("PROFILE_REQUIRES_EXPLICIT_SETTINGS");
      if (item.stage === "staff_notification" && environment.LEAD_DELIVERY_PROVIDER?.trim().toLowerCase() !== "resend") {
        problems.push("RESEND_STAFF_PROVIDER_REQUIRED_FOR_BROCHURE_PROFILE");
      }
      return {
        ...item,
        requiredForProfile: item.stage !== "google_sheets",
        currentGate,
        missingKeys,
        status: problems.length ? "blocked" : item.status,
        reasons: [...new Set([...item.reasons, ...problems])],
      };
    });
  return {
    ...report,
    profile: "brochure",
    evaluation: "INTENDED_ROLLOUT_CONFIGURATION_CURRENT_GATES_REPORTED_SEPARATELY",
    privateApprovalVerification: "LOCAL_CATALOG_APPROVALS_REQUIRED_PUBLISHED_MAPPING_APPROVAL_NOT_CHECKED",
    stillUnverified: report.stillUnverified.filter((item) => sheetsEnabled || item !== "OPTIONAL_SHEETS_ACCESS_HEADERS_AND_ROW_RECEIPT"),
  };
}

/** Only fixed reason codes and setting names leave this function; never raw errors or values. */
export async function checkBrochureEmailSetup(environment = process.env, { checkFiles = false, profile } = {}) {
  if (profile === "brochure") return checkBrochureProfile(environment, checkFiles);
  if (profile !== undefined) throw new Error("Unsupported configuration profile");
  const stages = [];
  const delivery = isLeadDeliveryEnabled(environment);
  const notifications = isLeadNotificationEnabled(environment);
  const sheets = isGoogleSheetsDeliveryEnabled(environment);
  const brochure = environment.BROCHURE_EMAIL_ENABLED === "true";
  const webhook = environment.RESEND_WEBHOOK_ENABLED === "true";
  const stage = (name, flag, enabled, keys, reasons = []) => {
    // Match each runtime's parser; flag typos are not silently reported as ready/disabled.
    const invalid = gateState(environment, flag, enabled) === "invalid";
    stages.push({ stage: name, status: invalid || (enabled && reasons.length) ? "blocked" : enabled ? "configuration_valid" : "disabled",
      keys: [flag, ...keys.filter((key) => key !== flag)], reasons: invalid ? ["FLAG_VALUE_NOT_ACCEPTED_BY_RUNTIME"] : enabled ? reasons.length ? reasons : ["CONFIGURATION_ONLY_NOT_DELIVERY_PROOF"] : ["FEATURE_DISABLED"] });
  };
  const dbReason = databaseReason(environment);
  const intakeReasons = [];
  if (dbReason) intakeReasons.push(dbReason);
  if (environment.NODE_ENV === "production" && !environment.LEAD_RATE_LIMIT_SECRET?.trim()) intakeReasons.push("LEAD_RATE_LIMIT_SECRET_MISSING");
  if (isLeadIntakeEnabled(environment) && !isLeadIntakeReady(environment) && !intakeReasons.length) intakeReasons.push("NATIVE_INTAKE_CONFIGURATION_INVALID");
  stage("native_intake", "LEAD_INTAKE_ENABLED", isLeadIntakeEnabled(environment), ["DATABASE_URL", "LEAD_RATE_LIMIT_SECRET"], intakeReasons);
  stage("outbox", "LEAD_DELIVERY_ENABLED", delivery, ["DATABASE_URL", "LEAD_NOTIFICATIONS_ENABLED", "LEAD_SHEETS_ENABLED", "BROCHURE_EMAIL_ENABLED"], [
    ...(dbReason ? [dbReason] : []), ...(!notifications && !sheets && !brochure ? ["NO_DELIVERY_DESTINATION_ENABLED"] : []),
  ]);

  let provider;
  try { provider = readLeadDeliveryProvider(environment); } catch { /* Static reason below. */ }
  const senderNeeded = brochure || (notifications && provider === "resend");
  stages.push({ stage: "resend_sender", status: !senderNeeded ? "not_requested" : validConfig(readResendSettings, environment) ? "configuration_valid" : "blocked", keys: SENDER_KEYS,
    reasons: !senderNeeded ? ["NO_RESEND_DESTINATION_ENABLED"] : validConfig(readResendSettings, environment) ? ["DNS_AND_SENDER_VERIFICATION_NOT_CHECKED"] : ["RESEND_SENDER_SETTINGS_MISSING_OR_INVALID"] });

  const brochureReasons = [];
  if (!delivery) brochureReasons.push("LEAD_DELIVERY_ENABLED_REQUIRED");
  if (brochure && !validConfig(readBrochureEmailConfig, environment)) brochureReasons.push("BROCHURE_EMAIL_SETTINGS_MISSING_OR_INVALID");
  if (brochure) {
    const reason = await checkCatalog(environment, checkFiles);
    if (reason) brochureReasons.push(reason);
  }
  stage("brochure_email", "BROCHURE_EMAIL_ENABLED", brochure, [...BROCHURE_KEYS, ...SENDER_KEYS], brochureReasons);

  const notificationReaders = { resend: readResendLeadConfig, zeptomail: readZeptoMailConfig, powerautomate: readPowerAutomateConfig };
  const notificationKeys = provider === "resend" ? SENDER_KEYS : provider === "zeptomail" ? ["ZEPTOMAIL_API_URL", "ZEPTOMAIL_SEND_MAIL_TOKEN", "ZEPTOMAIL_FROM_EMAIL"] : ["POWER_AUTOMATE_FLOW_URL", "POWER_AUTOMATE_TENANT_ID", "POWER_AUTOMATE_CLIENT_ID", "POWER_AUTOMATE_CLIENT_SECRET"];
  stage("staff_notification", "LEAD_NOTIFICATIONS_ENABLED", notifications, ["LEAD_DELIVERY_PROVIDER", "LEAD_NOTIFICATION_TO", ...notificationKeys], [
    ...(!delivery ? ["LEAD_DELIVERY_ENABLED_REQUIRED"] : []),
    ...(notifications && (!provider || !validConfig(notificationReaders[provider], environment)) ? ["STAFF_NOTIFICATION_SETTINGS_MISSING_OR_INVALID"] : []),
  ]);
  stage("google_sheets", "LEAD_SHEETS_ENABLED", sheets, ["LEAD_SHEETS_SPREADSHEET_ID", "LEAD_SHEETS_TAB_NAME", "LEAD_GOOGLE_SERVICE_ACCOUNT_JSON"], [
    ...(!delivery ? ["LEAD_DELIVERY_ENABLED_REQUIRED"] : []),
    ...(sheets && !validConfig(readGoogleSheetsLeadConfig, environment) ? ["GOOGLE_SHEETS_SETTINGS_MISSING_OR_INVALID"] : []),
  ]);
  stage("resend_webhook", "RESEND_WEBHOOK_ENABLED", webhook, ["RESEND_WEBHOOK_SECRET", "DATABASE_URL"], [
    ...(dbReason ? [dbReason] : []), ...(!environment.RESEND_WEBHOOK_SECRET?.trim() ? ["RESEND_WEBHOOK_SECRET_MISSING"] : []),
  ]);
  return {
    scope: "READ_ONLY_CONFIGURATION_PREFLIGHT",
    activation: "NOT_PERFORMED_DISABLED_FEATURES_REMAIN_DISABLED",
    liveDeliveryVerified: false,
    databaseBoundary: "HOSTED_DATABASE_REQUIRED_NO_LOCAL_POSTGRES_SETUP_OR_CONNECTION",
    stages,
    fileVerification: checkFiles && brochure ? "APPROVED_FILE_CHECKS_REQUESTED_SEE_BROCHURE_STAGE" : "PDF_CONTENT_AND_HASHES_NOT_CHECKED",
    stillUnverified: ["HOSTED_MIGRATIONS_AND_TRANSACTIONAL_LEAD_CONSENT_OUTBOX_SAVE", "DNS_DOMAIN_VERIFICATION_AND_API_KEY_PERMISSIONS", "PUBLISHED_PROPERTY_AND_DESIGN_BROCHURE_MAPPING_APPROVAL", "WORKER_SCHEDULING_AND_RETRY", "REAL_CUSTOMER_AND_STAFF_INBOX_RECEIPT", "SIGNED_DOWNLOAD_ON_HOSTED_STORAGE", "WEBHOOK_REGISTRATION_SIGNATURE_AND_RECEIPT", "OPTIONAL_SHEETS_ACCESS_HEADERS_AND_ROW_RECEIPT"],
  };
}

export function preflightExitCode(report) { return report.stages.some((stage) => stage.status === "blocked") ? 1 : 0; }

async function main() {
  try {
    const args = process.argv.slice(2);
    let envFile;
    let checkFiles = false;
    let profile;
    while (args.length) {
      const argument = args.shift();
      if (argument === "--check-files" && !checkFiles) checkFiles = true;
      else if (argument === "--profile" && !profile && args[0] === "brochure") profile = args.shift();
      // Avoid Node's own --env-file flag, whose pre-entry errors can expose paths.
      else if (argument === "--settings-file" && !envFile && args[0] && !args[0].startsWith("--")) envFile = args.shift();
      else throw new Error();
    }
    if (envFile) {
      const info = await stat(envFile);
      if (!info.isFile() || info.size > MAX_METADATA_BYTES || typeof process.loadEnvFile !== "function") throw new Error();
      // Explicit file only. Existing shell variables take precedence; no automatic dotenv discovery.
      process.loadEnvFile(envFile);
    }
    const report = await checkBrochureEmailSetup(process.env, { checkFiles, profile });
    console.log(JSON.stringify(report, null, 2));
    return preflightExitCode(report);
  } catch {
    console.error("CONFIGURATION_PREFLIGHT_INPUT_FAILED: use node --import tsx scripts/check-brochure-email-setup.mjs [--settings-file FILE] [--profile brochure] [--check-files]. No settings values or paths are reported.");
    return 2;
  }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) process.exitCode = await main();
