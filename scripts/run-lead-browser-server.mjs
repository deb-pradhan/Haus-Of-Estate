import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

const workspace = fileURLToPath(new URL("../", import.meta.url));
const baseURL = "http://127.0.0.1:3220";

export function leadBrowserEnvironment(phase, inherited = process.env, dotenvSources = []) {
  const environment = {};
  // Inherit OS process essentials only, never host application credentials.
  for (const key of ["PATH", "Path", "SystemRoot", "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "COMSPEC", "PATHEXT", "APPDATA", "LOCALAPPDATA", "USERPROFILE"]) {
    if (inherited[key]) environment[key] = inherited[key];
  }
  // Next loads .env files itself. Predefine every declared key as empty so it
  // cannot restore real secrets that were removed from the inherited environment.
  for (const source of dotenvSources) {
    for (const match of source.matchAll(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/gm)) environment[match[1]] = "";
  }
  return {
    ...environment,
    NODE_ENV: "production",
    NEXT_TELEMETRY_DISABLED: "1",
    HAUS_NEXT_DIST_DIR: ".next-lead-browser",
    NEXT_PUBLIC_SITE_URL: baseURL,
    SITE_URL: baseURL,
    NEXT_PUBLIC_SANITY_PROJECT_ID: "jdxbkry4",
    NEXT_PUBLIC_SANITY_DATASET: "production",
    NEXT_PUBLIC_GTM_ID: "",
    NEXT_PUBLIC_SANITY_SOCIAL_CAMPAIGNS_ENABLED: "false",
    AUTH_ENABLED: "false",
    SAVED_CONTENT_ENABLED: "false",
    PROPERTY_ASSISTANT_ENABLED: "false",
    CAREERS_INTAKE_ENABLED: "false",
    LEAD_DELIVERY_ENABLED: "false",
    LEAD_SHEETS_ENABLED: "false",
    BOT_PROTECTION_ENABLED: "false",
    LEAD_INTAKE_ENABLED: phase === "runtime" ? "true" : "false",
    DATABASE_URL: phase === "runtime" ? "postgresql://playwright:unused@127.0.0.1:1/lead_ui_test?connect_timeout=1" : "",
    LEAD_RATE_LIMIT_SECRET: phase === "runtime" ? "playwright-lead-only-rate-secret-not-for-deployment" : "",
    LEAD_ALLOWED_ORIGINS: baseURL,
    AUTH_TRUST_HOST: "true",
    AUTH_SECRET: "playwright-lead-only-auth-secret-not-for-deployment",
    AUTH_URL: baseURL,
    RESEND_API_KEY: "",
    ZEPTOMAIL_SEND_MAIL_TOKEN: "",
    POWER_AUTOMATE_CLIENT_SECRET: "",
    LEAD_GOOGLE_SERVICE_ACCOUNT_JSON: "",
    SANITY_API_READ_TOKEN: "",
    SANITY_API_BROWSER_TOKEN: "",
    SANITY_REVALIDATE_SECRET: "",
  };
}

async function runNext(args, environment) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(process.execPath, [resolve(workspace, "node_modules/next/dist/bin/next"), ...args], {
      cwd: workspace, env: environment, stdio: "inherit", windowsHide: true,
    });
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop);
    process.once("SIGTERM", stop);
    const cleanup = () => { process.off("SIGINT", stop); process.off("SIGTERM", stop); };
    child.once("error", (error) => { cleanup(); rejectRun(error); });
    child.once("exit", (code) => { cleanup(); resolveRun(code ?? 1); });
  });
}

export async function runLeadBrowserServer() {
  const sources = await Promise.all([".env", ".env.local", ".env.production", ".env.production.local"].map(async (name) => {
    try { return await readFile(resolve(workspace, name), "utf8"); }
    catch (error) { if (error.code === "ENOENT") return ""; throw error; }
  }));
  console.info("Building lead browser artifact with intake disabled and no service credentials.");
  const built = await runNext(["build"], leadBrowserEnvironment("build", process.env, sources));
  if (built !== 0) return built;
  console.info("Starting the same artifact with test-only intake readiness; outbound delivery remains disabled.");
  return runNext(["start", "--hostname", "127.0.0.1", "--port", "3220"], leadBrowserEnvironment("runtime", process.env, sources));
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = await runLeadBrowserServer();
}
