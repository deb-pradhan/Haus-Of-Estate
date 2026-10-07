import assert from "node:assert/strict";
import test from "node:test";
import { leadBrowserEnvironment } from "./run-lead-browser-server.mjs";

test("production lead harness cannot inherit service credentials or recover them from dotenv", () => {
  const inherited = { PATH: "test-path", DATABASE_URL: "real-database", RESEND_API_KEY: "real-mail-key", PRIVATE_OTHER_KEY: "private" };
  const dotenv = ["DATABASE_URL=real-database\nRESEND_API_KEY=real-mail-key\nPRIVATE_OTHER_KEY=private\nexport CUSTOM_SECRET=private"];
  const build = leadBrowserEnvironment("build", inherited, dotenv);
  const runtime = leadBrowserEnvironment("runtime", inherited, dotenv);
  assert.equal(build.PATH, "test-path");
  assert.equal(build.LEAD_INTAKE_ENABLED, "false");
  assert.equal(build.DATABASE_URL, "");
  assert.equal(runtime.LEAD_INTAKE_ENABLED, "true");
  assert.match(runtime.DATABASE_URL, /127\.0\.0\.1:1\//);
  for (const environment of [build, runtime]) {
    for (const key of ["RESEND_API_KEY", "PRIVATE_OTHER_KEY", "CUSTOM_SECRET", "LEAD_GOOGLE_SERVICE_ACCOUNT_JSON"]) assert.equal(environment[key], "");
    for (const key of ["AUTH_ENABLED", "SAVED_CONTENT_ENABLED", "PROPERTY_ASSISTANT_ENABLED", "CAREERS_INTAKE_ENABLED", "LEAD_DELIVERY_ENABLED", "LEAD_SHEETS_ENABLED"]) assert.equal(environment[key], "false");
  }
});
