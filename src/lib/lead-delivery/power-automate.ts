import type { PowerAutomateConfig } from "./config";
import { LeadDeliveryError } from "./errors";
import type {
  LeadDeliveryPayload,
  LeadDeliveryTransport,
} from "./types";

interface AccessTokenResponse {
  access_token?: unknown;
  expires_in?: unknown;
}

interface CachedAccessToken {
  value: string;
  expiresAt: number;
}

interface FlowAcknowledgement {
  schemaVersion: string;
  eventId: string;
  leadId: string;
  rowAdded: boolean;
  notificationSent: boolean;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function statusCode(prefix: string, status: number): string {
  return `${prefix}_HTTP_${status}`;
}

function abortableSignal(timeoutMs: number): {
  signal: AbortSignal;
  stop: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  timer.unref?.();
  return {
    signal: controller.signal,
    stop: () => clearTimeout(timer),
  };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function isFlowAcknowledgement(
  value: unknown,
): value is FlowAcknowledgement {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FlowAcknowledgement>;
  return (
    typeof candidate.schemaVersion === "string" &&
    typeof candidate.eventId === "string" &&
    typeof candidate.leadId === "string" &&
    typeof candidate.rowAdded === "boolean" &&
    typeof candidate.notificationSent === "boolean"
  );
}

export class PowerAutomateLeadDeliveryTransport
  implements LeadDeliveryTransport
{
  private accessToken: CachedAccessToken | null = null;

  constructor(
    private readonly config: PowerAutomateConfig,
    private readonly fetchImplementation: typeof fetch = fetch,
    private readonly now: () => number = Date.now,
  ) {}

  async deliver(payload: LeadDeliveryPayload): Promise<void> {
    const deadline = this.now() + this.config.timeoutMs;
    const accessToken = await this.getAccessToken(deadline);
    const remainingMs = deadline - this.now();
    if (remainingMs <= 0) {
      throw new LeadDeliveryError("FLOW_TIMEOUT", true);
    }
    const request = abortableSignal(remainingMs);

    try {
      const response = await this.fetchImplementation(this.config.flowUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Idempotency-Key": payload.eventId,
          "X-Haus-Event-Version": payload.schemaVersion,
        },
        body: JSON.stringify(payload),
        signal: request.signal,
      });

      if (!response.ok) {
        throw new LeadDeliveryError(
          statusCode("FLOW", response.status),
          isRetryableStatus(response.status),
        );
      }

      if (response.status !== 200 && response.status !== 201) {
        throw new LeadDeliveryError(
          statusCode("FLOW_INVALID_SUCCESS", response.status),
          true,
        );
      }

      let acknowledgement: unknown;
      try {
        acknowledgement = await response.json();
      } catch {
        throw new LeadDeliveryError("FLOW_INVALID_ACK", true);
      }

      if (
        !isFlowAcknowledgement(acknowledgement) ||
        acknowledgement.schemaVersion !== payload.schemaVersion ||
        acknowledgement.eventId !== payload.eventId ||
        acknowledgement.leadId !== payload.leadId ||
        !acknowledgement.notificationSent ||
        (response.status === 201) !== acknowledgement.rowAdded
      ) {
        throw new LeadDeliveryError("FLOW_INVALID_ACK", true);
      }
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      if (isAbortError(error)) {
        throw new LeadDeliveryError("FLOW_TIMEOUT", true);
      }
      throw new LeadDeliveryError("FLOW_NETWORK", true);
    } finally {
      request.stop();
    }
  }

  private async getAccessToken(deadline: number): Promise<string> {
    const now = this.now();
    if (this.accessToken && this.accessToken.expiresAt > now + 60_000) {
      return this.accessToken.value;
    }

    const remainingMs = deadline - now;
    if (remainingMs <= 0) {
      throw new LeadDeliveryError("OAUTH_TIMEOUT", true);
    }
    const request = abortableSignal(remainingMs);
    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(
      this.config.tenantId,
    )}/oauth2/v2.0/token`;

    try {
      const response = await this.fetchImplementation(tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: "client_credentials",
          scope: this.config.scope,
        }),
        signal: request.signal,
      });

      if (!response.ok) {
        throw new LeadDeliveryError(
          statusCode("OAUTH", response.status),
          isRetryableStatus(response.status),
        );
      }

      let tokenResponse: AccessTokenResponse;
      try {
        tokenResponse = (await response.json()) as AccessTokenResponse;
      } catch {
        throw new LeadDeliveryError("OAUTH_INVALID_RESPONSE", true);
      }

      if (
        typeof tokenResponse.access_token !== "string" ||
        tokenResponse.access_token.length === 0
      ) {
        throw new LeadDeliveryError("OAUTH_MISSING_TOKEN", true);
      }

      const expiresIn =
        typeof tokenResponse.expires_in === "number" &&
        tokenResponse.expires_in > 0
          ? tokenResponse.expires_in
          : 300;

      this.accessToken = {
        value: tokenResponse.access_token,
        expiresAt: now + expiresIn * 1_000,
      };
      return this.accessToken.value;
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      if (isAbortError(error)) {
        throw new LeadDeliveryError("OAUTH_TIMEOUT", true);
      }
      throw new LeadDeliveryError("OAUTH_NETWORK", true);
    } finally {
      request.stop();
    }
  }
}
