import { NextResponse } from "next/server";
import { attemptImmediateLeadDelivery } from "@/lib/lead-delivery";
import {
  LeadConflictError,
  LeadInfrastructureError,
  LeadOriginError,
  LeadRateLimitError,
  LeadValidationError,
} from "@/lib/lead-intake/errors";
import { notifyLegacyLead } from "@/lib/lead-intake/legacy";
import { normalizeLeadRequest } from "@/lib/lead-intake/normalize";
import {
  assertAllowedLeadOrigin,
  extractClientAddress,
  hashClientAddress,
  isHoneypotFilled,
  isLeadIntakeEnabled,
  isV2LeadPayload,
} from "@/lib/lead-intake/security";
import { submitLeadIntake } from "@/lib/lead-intake/service";

export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1_024;

function errorResponse(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extra }, { status });
}

function isPrismaFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; name?: unknown };
  return (
    (typeof candidate.code === "string" && candidate.code.startsWith("P")) ||
    (typeof candidate.name === "string" && candidate.name.includes("Prisma"))
  );
}

async function parseBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new LeadValidationError("Invalid submission");
  }
  try {
    const reader = request.body?.getReader();
    if (!reader) throw new LeadValidationError("Invalid submission");

    const decoder = new TextDecoder();
    let rawBody = "";
    let bytesRead = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new LeadValidationError("Invalid submission");
      }
      rawBody += decoder.decode(value, { stream: true });
    }
    rawBody += decoder.decode();
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new LeadValidationError("Invalid submission");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseBody(request);
    const v2Payload = isV2LeadPayload(body);

    assertAllowedLeadOrigin(request);
    if (isHoneypotFilled(body)) {
      throw new LeadValidationError("Invalid submission");
    }

    if (!isLeadIntakeEnabled()) {
      if (v2Payload) {
        return errorResponse("Lead intake is temporarily unavailable", 503);
      }
    }

    const input = normalizeLeadRequest(body);
    const ipHash = hashClientAddress(extractClientAddress(request));
    const result = await submitLeadIntake(input, ipHash);

    let deliveryOutcome: Awaited<ReturnType<typeof attemptImmediateLeadDelivery>> =
      "disabled";
    if (result.created && result.outboxId) {
      try {
        deliveryOutcome = await attemptImmediateLeadDelivery(result.outboxId);
      } catch {
        console.error("Immediate lead delivery failed");
      }
    }

    if (!v2Payload && result.created && deliveryOutcome === "disabled") {
      void notifyLegacyLead(input, result).catch(() => {
        console.error("Legacy lead notification failed");
      });
    }

    return NextResponse.json(
      {
        success: true,
        status: result.created ? "created" : "duplicate",
        tier: result.tier,
        score: result.score,
        leadId: result.leadId,
        submissionId: result.submissionId,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    if (error instanceof LeadValidationError) {
      return errorResponse("Invalid submission", 400, {
        fieldErrors: error.fieldErrors,
      });
    }
    if (error instanceof LeadOriginError) {
      return errorResponse("Origin not allowed", 403);
    }
    if (error instanceof LeadConflictError) {
      return errorResponse("Submission ID already used", 409);
    }
    if (error instanceof LeadRateLimitError) {
      return NextResponse.json(
        { error: "Too many submissions" },
        {
          status: 429,
          headers: { "Retry-After": String(error.retryAfterSeconds) },
        },
      );
    }
    if (error instanceof LeadInfrastructureError || isPrismaFailure(error)) {
      console.error("Lead intake infrastructure failure");
      return errorResponse("Lead intake is temporarily unavailable", 503);
    }

    console.error("Lead intake request failed");
    return errorResponse("Internal server error", 500);
  }
}
