import { describe, expect, it } from "vitest";
import { isCurrentSessionVersion } from "../../src/lib/auth/session-version";

describe("session version checks", () => {
  it("accepts a legacy token only before any revocation", () => {
    expect(isCurrentSessionVersion(undefined, 0)).toBe(true);
    expect(isCurrentSessionVersion(undefined, 1)).toBe(false);
  });

  it("rejects an explicitly stale token", () => {
    expect(isCurrentSessionVersion(2, 3)).toBe(false);
    expect(isCurrentSessionVersion(3, 3)).toBe(true);
  });
});
