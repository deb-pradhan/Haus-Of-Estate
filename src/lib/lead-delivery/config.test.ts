import { describe, expect, it } from "vitest";

import {
  isLeadDeliveryEnabled,
  readLeadDeliveryWorkerOptions,
  readPowerAutomateConfig,
} from "./config";
import { attemptImmediateLeadDelivery } from "./runtime";

describe("lead delivery configuration", () => {
  it("keeps outbound delivery disabled by default", () => {
    expect(isLeadDeliveryEnabled({})).toBe(false);
    expect(isLeadDeliveryEnabled({ LEAD_DELIVERY_ENABLED: "false" })).toBe(
      false,
    );
    expect(isLeadDeliveryEnabled({ LEAD_DELIVERY_ENABLED: "TRUE" })).toBe(true);
  });

  it("does not touch delivery infrastructure for disabled immediate attempts", async () => {
    await expect(attemptImmediateLeadDelivery("event-1", {})).resolves.toBe(
      "disabled",
    );
  });

  it("requires an HTTPS flow URL and service-principal credentials", () => {
    expect(() =>
      readPowerAutomateConfig({
        POWER_AUTOMATE_FLOW_URL: "http://flow.example.test",
        POWER_AUTOMATE_TENANT_ID: "tenant",
        POWER_AUTOMATE_CLIENT_ID: "client",
        POWER_AUTOMATE_CLIENT_SECRET: "secret",
      }),
    ).toThrow("HTTPS");
  });

  it("requests the exact public-cloud Power Automate audience", () => {
    const config = readPowerAutomateConfig({
      POWER_AUTOMATE_FLOW_URL: "https://flow.example.test/lead",
      POWER_AUTOMATE_TENANT_ID: "tenant",
      POWER_AUTOMATE_CLIENT_ID: "client",
      POWER_AUTOMATE_CLIENT_SECRET: "secret",
    });

    expect(config.scope).toBe(
      "https://service.flow.microsoft.com//.default",
    );
  });

  it("uses bounded worker defaults for invalid tuning values", () => {
    const options = readLeadDeliveryWorkerOptions("worker", {
      LEAD_DELIVERY_BATCH_SIZE: "1000",
      LEAD_DELIVERY_MAX_ATTEMPTS: "0",
    });
    expect(options).toMatchObject({
      workerId: "worker",
      batchSize: 20,
      maxAttempts: 8,
      leaseDurationMs: 600_000,
      baseRetryDelayMs: 300_000,
      maxRetryDelayMs: 21_600_000,
    });
  });
});
