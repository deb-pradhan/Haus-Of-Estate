import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getClientIp: vi.fn(() => "203.0.113.8"),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/request-security", () => ({
  getClientIp: mocks.getClientIp,
}));

import {
  getBotProtectionClientConfig,
  getTurnstileServerConfig,
  isBotProtectionEnabled,
} from "@/lib/bot-protection/config";
import { verifyBotChallenge } from "@/lib/bot-protection/verify";

const TURNSTILE_SITEVERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

function request() {
  return new Request("https://hausofestate.com/api/auth/register", {
    method: "POST",
  });
}

function siteverifyResponse(
  body: Record<string, unknown>,
  init: ResponseInit = {},
) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("Turnstile bot protection", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("BOT_PROTECTION_ENABLED", "true");
    vi.stubEnv("TURNSTILE_SITE_KEY", "site-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "hausofestate.com");
    mocks.getClientIp.mockReturnValue("203.0.113.8");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("remains disabled unless the feature flag is exactly true", async () => {
    vi.stubEnv("BOT_PROTECTION_ENABLED", "false");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    expect(isBotProtectionEnabled()).toBe(false);
    expect(getBotProtectionClientConfig()).toEqual({ enabled: false });
    await expect(
      verifyBotChallenge({
        request: request(),
        token: undefined,
        action: "register",
      }),
    ).resolves.toEqual({ ok: true, skipped: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when enabled credentials or hostnames are missing", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "");

    expect(getBotProtectionClientConfig()).toEqual({
      enabled: true,
      siteKey: null,
    });
    expect(() => getTurnstileServerConfig()).toThrowError(
      expect.objectContaining({ code: "TURNSTILE_CREDENTIALS_MISSING" }),
    );
    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it.each([
    "*.hausofestate.com",
    "https://hausofestate.com",
    "hausofestate.com:443",
    "bad host.example",
  ])("rejects an unsafe hostname configuration: %s", (hostname) => {
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", hostname);

    expect(() => getTurnstileServerConfig()).toThrowError(
      expect.objectContaining({ code: "TURNSTILE_HOSTNAMES_INVALID" }),
    );
  });

  it("rejects test credentials and local hostnames in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("TURNSTILE_SITE_KEY", "1x00000000000000000000AA");

    expect(() => getTurnstileServerConfig()).toThrowError(
      expect.objectContaining({ code: "TURNSTILE_TEST_KEY_IN_PRODUCTION" }),
    );

    vi.stubEnv("TURNSTILE_SITE_KEY", "production-site-key");
    vi.stubEnv(
      "TURNSTILE_SECRET_KEY",
      "2x0000000000000000000000000000000AA",
    );
    expect(() => getTurnstileServerConfig()).toThrowError(
      expect.objectContaining({ code: "TURNSTILE_TEST_KEY_IN_PRODUCTION" }),
    );

    vi.stubEnv("TURNSTILE_SECRET_KEY", "production-secret-key");
    vi.stubEnv("TURNSTILE_ALLOWED_HOSTNAMES", "localhost,127.0.0.1");
    expect(() => getTurnstileServerConfig()).toThrowError(
      expect.objectContaining({ code: "TURNSTILE_LOCAL_HOST_IN_PRODUCTION" }),
    );
  });

  it.each([undefined, null, "", "   ", "x".repeat(2_049)])(
    "rejects a missing or oversized token before making a provider request",
    async (token) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(
        verifyBotChallenge({
          request: request(),
          token,
          action: "register",
        }),
      ).resolves.toEqual({ ok: false, reason: "missing" });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("validates the token server-side with action, hostname, and trusted IP checks", async () => {
    const fetchMock = vi.fn(async () =>
      siteverifyResponse({
        success: true,
        action: "register",
        hostname: "HausOfEstate.com.",
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "  challenge-token  ",
        action: "register",
      }),
    ).resolves.toEqual({ ok: true, skipped: false });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe(TURNSTILE_SITEVERIFY_URL);
    expect(init).toMatchObject({
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("secret-key");
    expect(body.get("response")).toBe("challenge-token");
    expect(body.get("remoteip")).toBe("203.0.113.8");
    expect(body.get("idempotency_key")).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it.each([
    {
      label: "wrong action",
      response: {
        success: true,
        action: "forgot_password",
        hostname: "hausofestate.com",
      },
    },
    {
      label: "wrong hostname",
      response: {
        success: true,
        action: "register",
        hostname: "attacker.example",
      },
    },
    {
      label: "replayed or invalid token",
      response: {
        success: false,
        "error-codes": ["timeout-or-duplicate"],
      },
    },
  ])("rejects a provider response with $label", async ({ response }) => {
    vi.stubGlobal("fetch", vi.fn(async () => siteverifyResponse(response)));

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "rejected" });
  });

  it("treats provider internal errors as unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        siteverifyResponse({
          success: false,
          "error-codes": ["internal-error"],
        }),
      ),
    );

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it.each([
    "missing-input-secret",
    "invalid-input-secret",
    "sitekey-secret-mismatch",
    "invalid-input-idempotency-key",
    "bad-request",
  ])("treats provider configuration error %s as unavailable", async (code) => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        siteverifyResponse({
          success: false,
          "error-codes": [code],
        }),
      ),
    );

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it.each([
    {
      label: "network failure",
      fetchImpl: vi.fn(async () => {
        throw new Error("network unavailable");
      }),
    },
    {
      label: "provider HTTP failure",
      fetchImpl: vi.fn(async () => new Response(null, { status: 503 })),
    },
    {
      label: "malformed provider response",
      fetchImpl: vi.fn(async () => new Response("not-json", { status: 200 })),
    },
  ])("fails closed on $label", async ({ fetchImpl }) => {
    vi.stubGlobal("fetch", fetchImpl);

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("fails closed when the trusted client IP cannot be resolved", async () => {
    mocks.getClientIp.mockImplementationOnce(() => {
      throw new Error("proxy configuration missing");
    });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      verifyBotChallenge({
        request: request(),
        token: "challenge-token",
        action: "register",
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
