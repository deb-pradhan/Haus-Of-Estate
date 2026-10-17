import { NextResponse } from "next/server";
import { signIn } from "@/auth";
import { sendLoginAlertEmail } from "@/lib/email/resend";
import { db } from "@/lib/db";
import {
  createRateLimiter,
  enforceRateLimit,
  isHoneypotTripped,
} from "@/lib/rate-limit";
import { clampString, isEmail, normaliseEmail, singleLine } from "@/lib/security";

// Same ids/limits as the Auth.js credentials callback ([...nextauth]/route.ts)
// so both entry points share one budget.
const ipLimiter = createRateLimiter({
  id: "auth-credentials",
  limit: 10,
  windowMs: 10 * 60_000,
});
const accountLimiter = createRateLimiter({
  id: "auth-credentials-account",
  limit: 5,
  windowMs: 10 * 60_000,
});

const INVALID = { error: "Invalid email or password" };

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit(request, ipLimiter);
    if (limited) return limited;

    let body: Record<string, unknown>;
    try {
      body = (await request.json()) ?? {};
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Honeypot: pretend to fail like any wrong password.
    if (isHoneypotTripped(body.website)) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    const email = normaliseEmail(clampString(body.email, 254));
    const password = typeof body.password === "string" ? body.password : "";
    const device = singleLine(body.device, 120) || "Unknown device";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }
    // Malformed addresses cannot match an account: same generic answer.
    if (!isEmail(email) || password.length > 72) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    const byAccount = await accountLimiter.check(`email:${email}`);
    if (!byAccount.allowed) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a few minutes and try again." },
        {
          status: 429,
          headers: { "Retry-After": String(byAccount.retryAfterSeconds) },
        }
      );
    }

    let result: { error?: string } | undefined;
    try {
      result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
    } catch {
      // Auth.js throws CredentialsSignin on bad credentials.
      return NextResponse.json(INVALID, { status: 401 });
    }

    if (result?.error) {
      return NextResponse.json(INVALID, { status: 401 });
    }

    // Send login alert email (async, non-blocking). The email content is
    // escaped inside sendLoginAlertEmail; `device` is also length-limited here.
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      sendLoginAlertEmail(email, user.name, device).catch(() =>
        console.error("[auth/login] login alert email failed")
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    console.error("[auth/login] unexpected error");
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
