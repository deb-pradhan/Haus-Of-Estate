import { createHmac } from "node:crypto";
import { authDb, type AuthThrottleRecord } from "@/lib/auth/auth-db";
import { AuthConfigurationError } from "@/lib/auth/errors";
import { getClientIp } from "@/lib/auth/request-security";

export type AuthThrottleScope =
  | "LOGIN"
  | "REGISTER"
  | "RESEND_VERIFICATION"
  | "FORGOT_PASSWORD"
  | "VERIFY_EMAIL"
  | "RESET_PASSWORD";

export interface ThrottleRule {
  limit: number;
  windowMs: number;
  blockMs?: number;
}

export interface ThrottleIdentifier {
  kind: "email" | "token";
  value: string;
}

export interface EnforceAuthThrottleOptions {
  scope: AuthThrottleScope;
  identifier?: ThrottleIdentifier;
  ip: ThrottleRule;
  identifierRule?: ThrottleRule;
}

export interface AuthThrottleDecision {
  allowed: boolean;
  retryAfterSeconds: number;
}

export async function enforceAuthIpThrottle(
  request: Request,
  options: { scope: AuthThrottleScope; rule: ThrottleRule },
): Promise<AuthThrottleDecision> {
  const ipHash = hashThrottleIdentifier(
    options.scope,
    "ip",
    getClientIp(request),
  );
  return applyRule(options.scope, ipHash, options.rule);
}

export async function enforceAuthIdentifierThrottle(options: {
  scope: AuthThrottleScope;
  identifier: ThrottleIdentifier;
  rule: ThrottleRule;
}): Promise<AuthThrottleDecision> {
  const identifierHash = hashThrottleIdentifier(
    options.scope,
    options.identifier.kind,
    options.identifier.value,
  );
  return applyRule(options.scope, identifierHash, options.rule);
}

function throttleSecret(): string {
  const secret = process.env.AUTH_THROTTLE_SECRET ?? process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== "production") {
    return "development-only-auth-throttle-secret";
  }
  throw new AuthConfigurationError("AUTH_THROTTLE_SECRET_MISSING");
}

export function hashThrottleIdentifier(
  scope: AuthThrottleScope,
  kind: "ip" | ThrottleIdentifier["kind"],
  value: string,
): string {
  return createHmac("sha256", throttleSecret())
    .update(`${scope}:${kind}:${value}`)
    .digest("hex");
}

function secondsUntil(date: Date, now: Date): number {
  return Math.max(1, Math.ceil((date.getTime() - now.getTime()) / 1_000));
}

function isRetryableTransactionFailure(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    ["P2002", "P2034"].includes(
      String((error as { code?: unknown }).code),
    )
  );
}

async function applyRule(
  scope: AuthThrottleScope,
  keyHash: string,
  rule: ThrottleRule,
): Promise<AuthThrottleDecision> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await authDb.$transaction(async (transaction) => {
        const now = new Date();
        const current = await transaction.authThrottle.findUnique({
          where: { scope_keyHash: { scope, keyHash } },
        });

        if (!current) {
          await transaction.authThrottle.create({
            data: {
              scope,
              keyHash,
              windowStart: now,
              attempts: 1,
              blockedUntil: null,
            },
          });
          return { allowed: true, retryAfterSeconds: 0 };
        }

        if (current.blockedUntil && current.blockedUntil > now) {
          return {
            allowed: false,
            retryAfterSeconds: secondsUntil(current.blockedUntil, now),
          };
        }

        const windowEnd = new Date(current.windowStart.getTime() + rule.windowMs);
        if (windowEnd <= now) {
          await transaction.authThrottle.update({
            where: { id: current.id },
            data: {
              windowStart: now,
              attempts: 1,
              blockedUntil: null,
            },
          });
          return { allowed: true, retryAfterSeconds: 0 };
        }

        if (current.attempts >= rule.limit) {
          const blockedUntil = new Date(
            now.getTime() + (rule.blockMs ?? rule.windowMs),
          );
          await transaction.authThrottle.update({
            where: { id: current.id },
            data: {
              attempts: { increment: 1 },
              blockedUntil,
            },
          });
          return {
            allowed: false,
            retryAfterSeconds: secondsUntil(blockedUntil, now),
          };
        }

        await transaction.authThrottle.update({
          where: { id: current.id },
          data: { attempts: { increment: 1 } },
        });
        return { allowed: true, retryAfterSeconds: 0 };
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (!isRetryableTransactionFailure(error) || attempt === 2) throw error;
    }
  }

  throw new Error("Auth throttle transaction could not be completed");
}

function stricterDecision(
  first: AuthThrottleDecision,
  second: AuthThrottleDecision,
): AuthThrottleDecision {
  if (first.allowed && second.allowed) return first;
  return {
    allowed: false,
    retryAfterSeconds: Math.max(
      first.retryAfterSeconds,
      second.retryAfterSeconds,
    ),
  };
}

export async function enforceAuthThrottle(
  request: Request,
  options: EnforceAuthThrottleOptions,
): Promise<AuthThrottleDecision> {
  const ipDecision = await enforceAuthIpThrottle(request, {
    scope: options.scope,
    rule: options.ip,
  });

  // A blocked client must not be able to consume another account's identifier
  // allowance by continuing to submit victim email addresses.
  if (!ipDecision.allowed) return ipDecision;

  if (!options.identifier || !options.identifierRule) return ipDecision;

  const identifierDecision = await enforceAuthIdentifierThrottle({
    scope: options.scope,
    identifier: options.identifier,
    rule: options.identifierRule,
  });
  return stricterDecision(ipDecision, identifierDecision);
}

export function enforceLoginThrottle(request: Request, email: string) {
  return enforceAuthThrottle(request, {
    scope: "LOGIN",
    identifier: { kind: "email", value: email },
    ip: { limit: 10, windowMs: 10 * 60 * 1_000 },
    identifierRule: { limit: 5, windowMs: 10 * 60 * 1_000 },
  });
}

export type { AuthThrottleRecord };
