import type { NextRequest } from "next/server";
import { handlers } from "@/auth";
import {
  createRateLimiter,
  enforceRateLimit,
  tooManyRequests,
} from "@/lib/rate-limit";
import { normaliseEmail } from "@/lib/security";

export const { GET } = handlers;

// Credential sign-ins: 10 attempts / 10 min per IP, and 5 / 10 min per account
// so one address cannot be hammered from many IPs.
const credentialsLimiter = createRateLimiter({
  id: "auth-credentials",
  limit: 10,
  windowMs: 10 * 60_000,
});
const accountLimiter = createRateLimiter({
  id: "auth-credentials-account",
  limit: 5,
  windowMs: 10 * 60_000,
});

export async function POST(request: NextRequest) {
  if (new URL(request.url).pathname.endsWith("/callback/credentials")) {
    const limited = await enforceRateLimit(request, credentialsLimiter);
    if (limited) return asAuthJsResponse(request, limited);

    let email = "";
    try {
      const form = await request.clone().formData();
      const value = form.get("email");
      email = typeof value === "string" ? normaliseEmail(value).slice(0, 254) : "";
    } catch {
      // Unparseable body: let Auth.js reject it.
    }
    if (email) {
      const result = await accountLimiter.check(`email:${email}`);
      if (!result.allowed) {
        return asAuthJsResponse(request, tooManyRequests(result));
      }
    }
  }
  return handlers.POST(request);
}

/**
 * `signIn(..., { redirect: false })` from next-auth/react reads `data.url` from
 * the JSON body, so a bare 429 would surface as a TypeError. Answer in the
 * shape it expects (error code in the URL) while keeping the 429 status and
 * Retry-After header.
 */
async function asAuthJsResponse(request: NextRequest, limited: Response) {
  if (!request.headers.get("x-auth-return-redirect")) return limited;
  const origin = process.env.AUTH_URL
    ? new URL(process.env.AUTH_URL).origin
    : new URL(request.url).origin;
  const headers = new Headers(limited.headers);
  headers.set("Content-Type", "application/json");
  return new Response(
    JSON.stringify({ url: `${origin}/auth/login?error=RateLimited` }),
    { status: 429, headers },
  );
}
