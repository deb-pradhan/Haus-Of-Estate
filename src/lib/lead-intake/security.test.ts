import { describe, expect, it } from "vitest";
import { LeadInfrastructureError, LeadOriginError } from "./errors";
import {
  assertAllowedLeadOrigin,
  extractClientAddress,
  hashClientAddress,
  isHoneypotFilled,
  isLeadIntakeEnabled,
  isV2LeadPayload,
} from "./security";

describe("lead intake security", () => {
  it("keeps lead intake disabled unless explicitly enabled", () => {
    expect(isLeadIntakeEnabled({})).toBe(false);
    expect(isLeadIntakeEnabled({ LEAD_INTAKE_ENABLED: "true" })).toBe(true);
  });

  it("enforces the production origin allowlist", () => {
    const environment = { NODE_ENV: "production" };
    expect(() =>
      assertAllowedLeadOrigin(
        new Request("https://hausofestate.com/api/leads", {
          headers: { origin: "https://hausofestate.com" },
        }),
        environment,
      ),
    ).not.toThrow();
    expect(() =>
      assertAllowedLeadOrigin(
        new Request("https://hausofestate.com/api/leads", {
          headers: { origin: "https://attacker.example" },
        }),
        environment,
      ),
    ).toThrow(LeadOriginError);
  });

  it("detects honeypot and nested v2 payloads", () => {
    expect(isHoneypotFilled({ website: "https://spam.example" })).toBe(true);
    expect(isHoneypotFilled({ website: " " })).toBe(false);
    expect(isV2LeadPayload({ contact: {} })).toBe(true);
    expect(isV2LeadPayload({ intent: "buyer" })).toBe(false);
  });

  it("hashes the client address without retaining it", () => {
    const request = new Request("https://hausofestate.com/api/leads", {
      headers: {
        "x-real-ip": "203.0.113.9",
        "x-forwarded-for": "198.51.100.42, 10.0.0.1",
      },
    });
    const address = extractClientAddress(request, { NODE_ENV: "production" });
    const hash = hashClientAddress(address, {
      LEAD_RATE_LIMIT_SECRET: "test-secret",
    });
    expect(address).toBe("203.0.113.9");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(address);
  });

  it("does not trust a caller-controlled forwarded address in production", () => {
    const request = new Request("https://hausofestate.com/api/leads", {
      headers: { "x-forwarded-for": "198.51.100.42" },
    });

    expect(extractClientAddress(request, { NODE_ENV: "production" })).toBe(
      "unknown",
    );
    expect(extractClientAddress(request, { NODE_ENV: "test" })).toBe(
      "198.51.100.42",
    );
  });

  it("requires an HMAC secret in production", () => {
    expect(() =>
      hashClientAddress("203.0.113.9", { NODE_ENV: "production" }),
    ).toThrow(LeadInfrastructureError);
  });
});
