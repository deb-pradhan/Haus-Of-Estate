import { describe, expect, it } from "vitest";
import {
  migrationHistoryDecision,
  migrationApprovalDecision,
  pendingMigrationDetails,
  pendingMigrations,
} from "../../scripts/migration-approval.mjs";

const BASELINE = "20260901000000_baseline";
const AUTH = "20260901001000_auth_hardening";

describe("migration approval gate", () => {
  it("allows a code-only deploy when every migration is applied", () => {
    const pending = pendingMigrations([BASELINE, AUTH], [BASELINE, AUTH]);
    expect(migrationApprovalDecision(pending, undefined)).toMatchObject({
      allowed: true,
      reason: "up-to-date",
    });
  });

  it("allows only the exact reviewed pending set", () => {
    const pending = pendingMigrationDetails(
      [
        { name: BASELINE, checksum: "baseline-sha" },
        { name: AUTH, checksum: "auth-sha" },
      ],
      [{ name: BASELINE, checksum: "baseline-sha" }],
    );
    expect(
      migrationApprovalDecision(pending, `${AUTH}@auth-sha`),
    ).toMatchObject({
      allowed: true,
      reason: "approved",
    });
  });

  it("blocks a missing or incorrect approval", () => {
    const pending = [{ name: AUTH, checksum: "auth-sha" }];
    expect(migrationApprovalDecision(pending, undefined).allowed).toBe(false);
    expect(migrationApprovalDecision(pending, "true").allowed).toBe(false);
    expect(migrationApprovalDecision(pending, AUTH).allowed).toBe(false);
  });

  it("does not let an old approval authorize a future migration", () => {
    const future = "20261001000000_future_change";
    const pending = pendingMigrationDetails(
      [
        { name: BASELINE, checksum: "baseline-sha" },
        { name: AUTH, checksum: "auth-sha" },
        { name: future, checksum: "future-sha" },
      ],
      [{ name: BASELINE, checksum: "baseline-sha" }],
    );
    const decision = migrationApprovalDecision(pending, `${AUTH}@auth-sha`);
    expect(decision.allowed).toBe(false);
    expect(decision.requiredApproval).toBe(
      `${AUTH}@auth-sha,${future}@future-sha`,
    );
  });

  it("invalidates approval when pending SQL changes", () => {
    const pending = [{ name: AUTH, checksum: "reviewed-sha" }];
    expect(
      migrationApprovalDecision(pending, `${AUTH}@old-sha`).allowed,
    ).toBe(false);
  });

  it("blocks an older image when the database has a newer migration", () => {
    const history = migrationHistoryDecision(
      [{ name: BASELINE, checksum: "baseline" }],
      [
        { name: BASELINE, checksum: "baseline" },
        { name: AUTH, checksum: "auth" },
      ],
    );
    expect(history).toMatchObject({
      valid: false,
      unknownApplied: [AUTH],
    });
  });

  it("blocks a modified migration that was already applied", () => {
    const history = migrationHistoryDecision(
      [{ name: BASELINE, checksum: "local-checksum" }],
      [{ name: BASELINE, checksum: "database-checksum" }],
    );
    expect(history).toMatchObject({
      valid: false,
      checksumMismatches: [BASELINE],
    });
  });
});
