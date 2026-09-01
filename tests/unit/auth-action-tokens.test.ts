import { describe, expect, it } from "vitest";
import {
  createActionToken,
  hashActionToken,
} from "@/lib/auth/action-tokens";

describe("auth action-token material", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");

  it("stores a digest rather than the raw token", () => {
    const token = createActionToken("EMAIL_VERIFICATION", now);

    expect(token.rawToken).toMatch(/^[A-Za-z0-9_-]{40,}$/);
    expect(token.tokenHash).toBe(hashActionToken(token.rawToken));
    expect(token.tokenHash).not.toContain(token.rawToken);
    expect(token.expiresAt.toISOString()).toBe("2026-09-02T12:00:00.000Z");
  });

  it("uses a shorter expiry for password resets", () => {
    const token = createActionToken("PASSWORD_RESET", now);
    expect(token.expiresAt.toISOString()).toBe("2026-09-01T13:00:00.000Z");
  });

  it("generates independent token values", () => {
    const first = createActionToken("PASSWORD_RESET", now);
    const second = createActionToken("PASSWORD_RESET", now);
    expect(first.rawToken).not.toBe(second.rawToken);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });
});
