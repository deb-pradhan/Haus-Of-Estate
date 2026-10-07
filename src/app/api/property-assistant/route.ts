import { consumeStream, createAgentUIStreamResponse } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSameOriginRequest } from "@/lib/auth/request-security";
import {
  createPropertyAssistantAgent,
  sanitizePropertyAssistantMessages,
} from "@/lib/property-assistant/agent";
import { getPropertyAssistantConfig } from "@/lib/property-assistant/config";
import { assistantRequestSchema } from "@/lib/property-assistant/contracts";
import {
  finalizePropertyAssistantUsage,
  releasePropertyAssistantUsage,
  reservePropertyAssistantUsage,
} from "@/lib/property-assistant/usage";
import { isPropertyAssistantEnabled } from "@/lib/features";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GENERIC_UNAVAILABLE = "The assistant is temporarily unavailable.";

function jsonError(
  status: number,
  error: string,
  retryAfterSeconds?: number,
) {
  return NextResponse.json(
    { ok: false, error },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...(retryAfterSeconds
          ? { "Retry-After": String(retryAfterSeconds) }
          : {}),
      },
    },
  );
}

async function readLimitedJson(
  request: Request,
  maxBytes: number,
): Promise<unknown> {
  const contentType = request.headers
    .get("content-type")
    ?.split(";", 1)[0]
    ?.trim()
    .toLowerCase();
  if (contentType !== "application/json") throw new Error("INVALID_BODY");

  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const declaredBytes = Number(contentLength);
    if (!Number.isFinite(declaredBytes) || declaredBytes > maxBytes) {
      throw new Error("INVALID_BODY");
    }
  }
  if (!request.body) throw new Error("INVALID_BODY");

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let body = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      await reader.cancel();
      throw new Error("INVALID_BODY");
    }
    body += decoder.decode(value, { stream: true });
  }
  body += decoder.decode();
  return JSON.parse(body);
}

export async function POST(request: Request) {
  if (!isPropertyAssistantEnabled()) {
    return jsonError(404, "Not found.");
  }

  let userId: string;
  try {
    const session = await auth();
    if (typeof session?.user?.id !== "string") {
      return jsonError(401, "Sign in to use the assistant.");
    }
    userId = session.user.id;
  } catch {
    return jsonError(503, GENERIC_UNAVAILABLE);
  }

  if (!isSameOriginRequest(request)) {
    return jsonError(403, "This request is not allowed.");
  }

  let config;
  try {
    config = getPropertyAssistantConfig();
  } catch {
    return jsonError(503, GENERIC_UNAVAILABLE);
  }

  let messages;
  try {
    const body = await readLimitedJson(request, config.maxBodyBytes);
    const parsed = assistantRequestSchema.safeParse(body);
    if (!parsed.success) return jsonError(400, "Invalid assistant request.");
    messages = sanitizePropertyAssistantMessages(parsed.data, config);
  } catch {
    return jsonError(400, "Invalid assistant request.");
  }

  let reservationId: string;
  try {
    const usage = await reservePropertyAssistantUsage(request, userId, config);
    if (!usage.allowed) {
      return jsonError(
        429,
        "The assistant is busy. Please try again later.",
        usage.retryAfterSeconds,
      );
    }
    reservationId = usage.reservationId;
  } catch {
    return jsonError(503, GENERIC_UNAVAILABLE);
  }

  let consumedTokenUnits = 0;
  try {
    const agent = createPropertyAssistantAgent(config);
    return await createAgentUIStreamResponse({
      agent,
      uiMessages: messages,
      abortSignal: request.signal,
      timeout: {
        totalMs: config.timeoutMs,
        stepMs: Math.min(15_000, config.timeoutMs),
        firstChunkMs: config.firstChunkTimeoutMs,
        chunkMs: config.chunkTimeoutMs,
        toolMs: config.toolTimeoutMs,
      },
      sendReasoning: false,
      sendSources: false,
      headers: { "Cache-Control": "private, no-store" },
      consumeSseStream: ({ stream }) => consumeStream({ stream }),
      onStepEnd({ usage }) {
        consumedTokenUnits += usage.totalTokens ?? 0;
      },
      async onEnd() {
        try {
          await finalizePropertyAssistantUsage(
            reservationId,
            consumedTokenUnits,
          );
        } catch {
          // A short-lived reservation is reclaimed by the next request.
        }
      },
      onError: () => GENERIC_UNAVAILABLE,
    });
  } catch {
    try {
      await releasePropertyAssistantUsage(reservationId);
    } catch {
      // A short-lived reservation is reclaimed by the next request.
    }
    return jsonError(503, GENERIC_UNAVAILABLE);
  }
}
