import { describe, expect, it, vi } from "vitest";

import type { PowerAutomateConfig } from "./config";
import { PowerAutomateLeadDeliveryTransport } from "./power-automate";
import { buildLeadDeliveryPayload } from "./payload";

const config: PowerAutomateConfig = {
  flowUrl: "https://flow.example.test/lead",
  tenantId: "tenant-id",
  clientId: "client-id",
  clientSecret: "client-secret",
  scope: "https://service.flow.microsoft.com//.default",
  timeoutMs: 1_000,
};

const payload = buildLeadDeliveryPayload({
  eventId: "event-1",
  leadId: "lead-1",
  submittedAt: "2026-08-29T12:00:00.000Z",
  firstName: "Surya",
  email: "person@example.com",
  interest: "buy",
  newsletterOptIn: false,
});

describe("PowerAutomateLeadDeliveryTransport", () => {
  it("uses Entra client credentials and sends the exact event", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            schemaVersion: "1.0",
            eventId: "event-1",
            leadId: "lead-1",
            rowAdded: true,
            notificationSent: true,
          }),
          { status: 201 },
        ),
      );
    const transport = new PowerAutomateLeadDeliveryTransport(
      config,
      fetchMock as typeof fetch,
      () => 1_000,
    );

    await transport.deliver(payload);

    const [tokenUrl, tokenRequest] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe(
      "https://login.microsoftonline.com/tenant-id/oauth2/v2.0/token",
    );
    expect(tokenRequest.method).toBe("POST");
    expect(String(tokenRequest.body)).toContain("grant_type=client_credentials");
    expect(String(tokenRequest.body)).toContain("client_id=client-id");

    const [flowUrl, flowRequest] = fetchMock.mock.calls[1];
    expect(flowUrl).toBe(config.flowUrl);
    expect(flowRequest.headers).toMatchObject({
      Authorization: "Bearer token",
      "Content-Type": "application/json",
      "Idempotency-Key": "event-1",
      "X-Haus-Event-Version": "1.0",
    });
    expect(JSON.parse(String(flowRequest.body))).toEqual(payload);
  });

  it("reuses a non-expiring access token within one worker run", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockImplementation(
        async () =>
          new Response(
            JSON.stringify({
              schemaVersion: "1.0",
              eventId: "event-1",
              leadId: "lead-1",
              rowAdded: false,
              notificationSent: true,
            }),
            { status: 200 },
          ),
      );
    const transport = new PowerAutomateLeadDeliveryTransport(
      config,
      fetchMock as typeof fetch,
      () => 1_000,
    );

    await transport.deliver(payload);
    await transport.deliver(payload);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("classifies retryable and permanent HTTP failures", async () => {
    const retryFetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ access_token: "token", expires_in: 3600 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    const retryTransport = new PowerAutomateLeadDeliveryTransport(
      config,
      retryFetch as typeof fetch,
    );
    await expect(retryTransport.deliver(payload)).rejects.toMatchObject({
      code: "FLOW_HTTP_503",
      retryable: true,
    });

    const permanentFetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 401 }));
    const permanentTransport = new PowerAutomateLeadDeliveryTransport(
      config,
      permanentFetch as typeof fetch,
    );
    await expect(permanentTransport.deliver(payload)).rejects.toMatchObject({
      code: "OAUTH_HTTP_401",
      retryable: false,
    });
  });

  it("requires a completed, matching flow acknowledgement", async () => {
    const invalidAcknowledgements = [
      new Response(null, { status: 201 }),
      new Response(JSON.stringify({ accepted: true }), { status: 201 }),
      new Response(
        JSON.stringify({
          schemaVersion: "1.0",
          eventId: "different-event",
          leadId: "lead-1",
          rowAdded: true,
          notificationSent: true,
        }),
        { status: 201 },
      ),
      new Response(
        JSON.stringify({
          schemaVersion: "1.0",
          eventId: "event-1",
          leadId: "lead-1",
          rowAdded: true,
          notificationSent: false,
        }),
        { status: 201 },
      ),
      new Response(null, { status: 202 }),
    ];

    for (const flowResponse of invalidAcknowledgements) {
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ access_token: "token", expires_in: 3600 }),
            { status: 200 },
          ),
        )
        .mockResolvedValueOnce(flowResponse);
      const transport = new PowerAutomateLeadDeliveryTransport(
        config,
        fetchMock as typeof fetch,
      );

      await expect(transport.deliver(payload)).rejects.toMatchObject({
        retryable: true,
      });
    }
  });

  it("classifies token timeouts without exposing response data", async () => {
    const timeout = Object.assign(new Error("sensitive provider detail"), {
      name: "AbortError",
    });
    const fetchMock = vi.fn().mockRejectedValueOnce(timeout);
    const transport = new PowerAutomateLeadDeliveryTransport(
      config,
      fetchMock as typeof fetch,
    );

    await expect(transport.deliver(payload)).rejects.toMatchObject({
      code: "OAUTH_TIMEOUT",
      retryable: true,
      message: "OAUTH_TIMEOUT",
    });
  });

  it("shares one timeout budget across token and flow requests", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ access_token: "token", expires_in: 3600 }),
        { status: 200 },
      ),
    );
    const clock = vi
      .fn()
      .mockReturnValueOnce(1_000)
      .mockReturnValueOnce(1_000)
      .mockReturnValue(2_000);
    const transport = new PowerAutomateLeadDeliveryTransport(
      { ...config, timeoutMs: 1_000 },
      fetchMock as typeof fetch,
      clock,
    );

    await expect(transport.deliver(payload)).rejects.toMatchObject({
      code: "FLOW_TIMEOUT",
      retryable: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
