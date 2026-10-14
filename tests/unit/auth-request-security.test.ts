import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getClientIp,
  isSameOriginRequest,
} from "@/lib/auth/request-security";

afterEach(() => vi.unstubAllEnvs());

describe("auth request origin checks", () => {
  it("accepts the configured production origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hausofestate.com");
    const request = new Request("http://railway.internal/api/auth/register", {
      headers: { origin: "https://hausofestate.com" },
    });
    expect(isSameOriginRequest(request)).toBe(true);
  });

  it("does not trust an arbitrary production Host and matching Origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hausofestate.com");
    const request = new Request("https://attacker.example/api/auth/register", {
      headers: { origin: "https://attacker.example" },
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });

  it("fails closed when no production origin is configured", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("AUTH_URL", "");
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("AUTH_ALLOWED_ORIGINS", "");
    const request = new Request("https://hausofestate.com/api/auth/register", {
      headers: { origin: "https://hausofestate.com" },
    });
    expect(isSameOriginRequest(request)).toBe(false);
  });
});

describe("auth client IP trust", () => {
  it("requires an explicitly trusted proxy topology in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_TRUST_PROXY_HEADERS", "false");
    expect(() =>
      getClientIp(new Request("https://hausofestate.com")),
    ).toThrowError(/not configured/i);
  });

  it("uses only the configured Railway client-IP header", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_TRUST_PROXY_HEADERS", "true");
    vi.stubEnv("AUTH_CLIENT_IP_HEADER", "x-real-ip");
    const request = new Request("https://hausofestate.com", {
      headers: {
        "x-real-ip": "203.0.113.8",
        "cf-connecting-ip": "198.51.100.4",
      },
    });
    expect(getClientIp(request)).toBe("203.0.113.8");
  });

  it("does not fall back to a spoofable alternative header", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AUTH_TRUST_PROXY_HEADERS", "true");
    vi.stubEnv("AUTH_CLIENT_IP_HEADER", "x-real-ip");
    const request = new Request("https://hausofestate.com", {
      headers: { "cf-connecting-ip": "198.51.100.4" },
    });
    expect(() => getClientIp(request)).toThrowError(/not configured/i);
  });
});
