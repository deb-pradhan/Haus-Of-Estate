import { createRateLimiter, enforceRateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendWelcomeEmail, sendLeadNotificationToAdmin } from "@/lib/email/resend";
import { parseConsent } from "@/lib/consent";

const limiter = createRateLimiter({ id: "register", limit: 5, windowMs: 60 * 60_000 });
export async function POST(request: Request) {
  {
    const limited = await enforceRateLimit(request, limiter);
    if (limited) return limited;
  }
  try {
    const body = await request.json();
    const { name, password, phone, intent } = body ?? {};
    // Normalise so "A@x.com" and "a@x.com" are one account.
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : body?.email;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    // The person must have explicitly acknowledged the Terms and Privacy
    // Policy. There is no default: a missing value is a rejection.
    const consent = parseConsent(body);
    if (!consent.notice) {
      return NextResponse.json(
        { error: "Please confirm you have read the Terms of Service and Privacy Policy" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // ── Duplicate check ────────────────────────────────────────────────────────
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // ── Password hash ──────────────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 14);

    // ── Lead scoring ─────────────────────────────────────────────────────────────
    let score = 10;
    if (intent === "buyer") score += 30;
    else if (intent === "seller") score += 25;
    const tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "nurture";

    // ── Transaction: create user + lead record ─────────────────────────────────
    const [user, _lead] = await db.$transaction([
      db.user.create({
        data: { name, email, phone: phone ?? null, passwordHash },
      }),
      db.lead.create({
        data: {
          email,
          firstName: name,
          intent: intent ?? "account",
          // Records that the privacy notice was acknowledged. Marketing consent
          // is separate and, with no column for it yet, is carried in the
          // admin notification only.
          consentGiven: true,
          tier,
          score,
          source: "modal",
        },
      }),
    ]);

    // ── Async email notifications (non-blocking) ────────────────────────────────
    sendWelcomeEmail(email, name).catch((err: unknown) =>
      console.error(
        "Failed to send welcome email:",
        err instanceof Error ? err.name : "unknown error"
      )
    );
    sendLeadNotificationToAdmin({
      email,
      firstName: name,
      intent: intent ?? "account",
      tier,
      score,
      phone,
      consent: {
        notice: consent.notice,
        marketing: consent.marketing,
        channels: consent.marketingChannels,
        textVersion: typeof body.consentTextVersion === "string" ? body.consentTextVersion.slice(0, 20) : undefined,
        at: new Date().toISOString(),
        sourcePage: "/auth/register",
      },
    }).catch((err: unknown) =>
      console.error(
        "Failed to send lead notification:",
        err instanceof Error ? err.name : "unknown error"
      )
    );

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Registration error:",
      error instanceof Error ? error.name : "unknown error"
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}