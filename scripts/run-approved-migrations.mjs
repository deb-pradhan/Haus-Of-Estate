import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";
import {
  migrationHistoryDecision,
  migrationApprovalDecision,
  pendingMigrationDetails,
} from "./migration-approval.mjs";

async function localMigrations() {
  const migrationsUrl = new URL("../prisma/migrations/", import.meta.url);
  const entries = await readdir(migrationsUrl, {
    withFileTypes: true,
  });
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  return Promise.all(
    names.map(async (name) => {
      const sql = await readFile(new URL(`${name}/migration.sql`, migrationsUrl));
      return {
        name,
        checksum: createHash("sha256").update(sql).digest("hex"),
      };
    }),
  );
}

async function appliedMigrations(pool) {
  const tableResult = await pool.query(
    "SELECT to_regclass('public._prisma_migrations')::text AS table_name",
  );
  if (!tableResult.rows[0]?.table_name) return [];

  const applied = await pool.query(
    'SELECT migration_name, checksum FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL',
  );
  return applied.rows.map((row) => ({
    name: String(row.migration_name),
    checksum: String(row.checksum),
  }));
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Database migration check failed: DATABASE_URL is not configured.");
  process.exit(1);
}

const pool = new Pool({ connectionString, max: 1 });
let pending;
try {
  const local = await localMigrations();
  const applied = await appliedMigrations(pool);
  const history = migrationHistoryDecision(local, applied);
  if (!history.valid) {
    const details = [
      history.unknownApplied.length > 0
        ? `database-only migrations: ${history.unknownApplied.join(", ")}`
        : null,
      history.checksumMismatches.length > 0
        ? `modified applied migrations: ${history.checksumMismatches.join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("; ");
    throw new Error(`migration history diverged (${details})`);
  }
  pending = pendingMigrationDetails(local, applied);
} catch (error) {
  console.error(
    "Database migration check failed.",
    error instanceof Error ? error.message : "Unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}

if (process.exitCode) process.exit(process.exitCode);

const decision = migrationApprovalDecision(
  pending,
  process.env.HAUS_DATABASE_MIGRATIONS_APPROVED,
);

if (decision.reason === "up-to-date") {
  console.log("Database schema is up to date; no migration approval is required.");
  process.exit(0);
}

if (!decision.allowed) {
  console.error(
    `Database migration blocked. After backup, schema comparison, baseline resolution, and Deb's approval, set HAUS_DATABASE_MIGRATIONS_APPROVED=${decision.requiredApproval} for this deployment only.`,
  );
  process.exit(1);
}

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const child = spawn(command, ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("Unable to start Prisma migration deploy", error.message);
  process.exit(1);
});

child.on("exit", (code) => process.exit(code ?? 1));
