import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

async function verificationEmail() {
  const { sendVerificationEmail } = await import("@/lib/email/auth");
  return sendVerificationEmail({
    to: "surya@example.com",
    name: "Surya",
    rawToken: "abcdefghijklmnopqrstuvwxyz0123456789ABCDEFG",
    returnTo: "/saved",
  });
}

describe("auth email delivery", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://hausofestate.com");
  });

  afterEach(() => vi.unstubAllEnvs());

  it("fails closed when the provider is not configured", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(verificationEmail()).rejects.toMatchObject({
      code: "AUTH_EMAIL_PROVIDER_MISSING",
    });
  });

  it("treats a resolved Resend error as a delivery failure", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    send.mockResolvedValue({ data: null, error: { message: "Rejected" } });
    await expect(verificationEmail()).rejects.toMatchObject({
      code: "AUTH_EMAIL_DELIVERY_REJECTED",
    });
  });

  it("requires HTTPS action links in production", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://hausofestate.com");
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
    await expect(verificationEmail()).rejects.toMatchObject({
      code: "AUTH_SITE_URL_INVALID",
    });
  });

  it("returns the accepted provider result", async () => {
    vi.stubEnv("RESEND_API_KEY", "re_test");
    send.mockResolvedValue({ data: { id: "email-1" }, error: null });
    await expect(verificationEmail()).resolves.toMatchObject({
      data: { id: "email-1" },
      error: null,
    });
    const html = send.mock.calls.at(-1)?.[0]?.html as string;
    expect(html).toContain("/api/auth/action-token/exchange?");
    expect(html).toContain("purpose=email-verification");
    expect(html).not.toContain("/auth/verify-email?token=");
  });
});
