import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendWelcomeEmail, sendLeadNotificationToAdmin } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const { name, email, password, phone, intent, consentGiven } = await request.json();

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
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
          consentGiven: consentGiven ?? true,
          tier,
          score,
          source: "modal",
        },
      }),
    ]);

    // ── Async email notifications (non-blocking) ────────────────────────────────
    sendWelcomeEmail(email, name).catch((err) =>
      console.error("Failed to send welcome email:", err)
    );
    sendLeadNotificationToAdmin({
      email,
      firstName: name,
      intent: intent ?? "account",
      tier,
      score,
      phone,
    }).catch((err) =>
      console.error("Failed to send lead notification:", err)
    );

    return NextResponse.json(
      {
        success: true,
        user: { id: user.id, email: user.email, name: user.name },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}