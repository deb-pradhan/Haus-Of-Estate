export function pendingMigrations(localMigrations, appliedMigrations) {
  const applied = new Set(appliedMigrations);
  return [...localMigrations].sort().filter((name) => !applied.has(name));
}

export function pendingMigrationDetails(localMigrations, appliedMigrations) {
  const applied = new Set(appliedMigrations.map((migration) => migration.name));
  return localMigrations
    .filter((migration) => !applied.has(migration.name))
    .sort((left, right) => left.name.localeCompare(right.name));
}

export function migrationHistoryDecision(localMigrations, appliedMigrations) {
  const localByName = new Map(
    localMigrations.map((migration) => [migration.name, migration.checksum]),
  );
  const unknownApplied = appliedMigrations
    .filter((migration) => !localByName.has(migration.name))
    .map((migration) => migration.name)
    .sort();
  const checksumMismatches = appliedMigrations
    .filter(
      (migration) =>
        localByName.has(migration.name) &&
        localByName.get(migration.name) !== migration.checksum,
    )
    .map((migration) => migration.name)
    .sort();

  return {
    valid: unknownApplied.length === 0 && checksumMismatches.length === 0,
    unknownApplied,
    checksumMismatches,
  };
}

export function requiredMigrationApproval(pending) {
  return [...pending]
    .map((migration) =>
      typeof migration === "string"
        ? migration
        : `${migration.name}@${migration.checksum}`,
    )
    .sort()
    .join(",");
}

export function migrationApprovalDecision(pending, suppliedApproval) {
  if (pending.length === 0) {
    return { allowed: true, requiredApproval: "", reason: "up-to-date" };
  }

  const requiredApproval = requiredMigrationApproval(pending);
  return {
    allowed: suppliedApproval === requiredApproval,
    requiredApproval,
    reason:
      suppliedApproval === requiredApproval
        ? "approved"
        : "approval-required",
  };
}
