import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { releaseNeedsDatabase } from "./prepare-release-database.mjs";

test("release decision matches runtime flag parsing and keeps email-only careers independent", () => {
  for (const environment of [
    {},
    { AUTH_ENABLED: "false", LEAD_INTAKE_ENABLED: "false", LEAD_DELIVERY_ENABLED: "false" },
    { AUTH_ENABLED: "TRUE", LEAD_INTAKE_ENABLED: " true ", LEAD_DELIVERY_ENABLED: "yes" },
    { CAREERS_INTAKE_ENABLED: "true", SAVED_CONTENT_ENABLED: "true", PROPERTY_ASSISTANT_ENABLED: "true" },
  ]) assert.equal(releaseNeedsDatabase(environment), false);
  for (const environment of [
    { AUTH_ENABLED: "true" },
    { LEAD_INTAKE_ENABLED: "true" },
    { LEAD_INTAKE_ENABLED: "TRUE" },
    { LEAD_DELIVERY_ENABLED: "true" },
    { LEAD_DELIVERY_ENABLED: " TRUE " },
  ]) assert.equal(releaseNeedsDatabase(environment), true);
});

function runWithoutDatabase(environment = {}) {
  return spawnSync(process.execPath, [fileURLToPath(new URL("./prepare-release-database.mjs", import.meta.url))], {
    encoding: "utf8",
    timeout: 15_000,
    env: {
      ...process.env,
      DATABASE_URL: "",
      HAUS_DATABASE_MIGRATIONS_APPROVED: "",
      AUTH_ENABLED: "false",
      LEAD_INTAKE_ENABLED: "false",
      LEAD_DELIVERY_ENABLED: "false",
      ...environment,
    },
  });
}

test("disabled release succeeds without a database even when careers email intake is selected", () => {
  const result = runWithoutDatabase({ CAREERS_INTAKE_ENABLED: "true" });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /skipping database access and migrations/);
  assert.doesNotMatch(result.stdout, /db:migrate:approved/);
});

for (const flag of ["AUTH_ENABLED", "LEAD_INTAKE_ENABLED", "LEAD_DELIVERY_ENABLED"]) {
  test(`${flag} retains the unchanged migration gate and fails without a database`, () => {
    const result = runWithoutDatabase({ [flag]: "true" });
    assert.ifError(result.error);
    assert.equal(result.status, 1);
    assert.match(result.stdout, /db:migrate:approved/);
    assert.match(result.stderr, /DATABASE_URL is not configured/);
    assert.doesNotMatch(result.stdout, /skipping database access/);
  });
}
