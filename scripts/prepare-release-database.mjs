import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";

// Match each runtime flag's parsing exactly. Careers is an email-only service;
// saved content and AskHaus require AUTH_ENABLED before they can access the DB.
export function releaseNeedsDatabase(environment = process.env) {
  return environment.AUTH_ENABLED === "true"
    || environment.LEAD_INTAKE_ENABLED?.toLowerCase() === "true"
    || environment.LEAD_DELIVERY_ENABLED?.trim().toLowerCase() === "true";
}

export async function prepareReleaseDatabase() {
  if (!releaseNeedsDatabase()) {
    console.log("Database-backed features are disabled; skipping database access and migrations for this release.");
    return 0;
  }

  // Preserve the existing approval/history/checksum gate without modification.
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise((resolveExit) => {
    const child = spawn(command, ["run", "db:migrate:approved"], {
      cwd: fileURLToPath(new URL("../", import.meta.url)),
      stdio: "inherit",
      // Windows .cmd execution needs its command processor; arguments are fixed.
      shell: process.platform === "win32",
    });
    child.once("error", (error) => {
      console.error("Unable to start the approved database preparation command:", error.message);
      resolveExit(1);
    });
    child.once("exit", (code) => resolveExit(code ?? 1));
  });
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  process.exitCode = await prepareReleaseDatabase();
}
