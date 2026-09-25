import { describe, expect, it } from "vitest";

import {
  isLeadDeliveryEnabled,
  readLeadDeliveryWorkerOptions,
  readPowerAutomateConfig,
  readLeadDeliveryProvider,
  readZeptoMailConfig,
} from "./config";
import { attemptImmediateLeadDelivery, createConfiguredLeadDeliveryTransport } from "./runtime";
import { ZeptoMailLeadDeliveryTransport } from "./zeptomail";
import { PowerAutomateLeadDeliveryTransport } from "./power-automate";
import { ResendLeadDeliveryTransport } from "./resend";

const zeptoEnvironment = {
  LEAD_DELIVERY_PROVIDER: "zeptomail",
  ZEPTOMAIL_API_URL: "https://api.zeptomail.eu/v1.1/email",
  ZEPTOMAIL_SEND_MAIL_TOKEN: "test-send-key",
  ZEPTOMAIL_FROM_EMAIL: "noreply@hausofestate.com",
  LEAD_NOTIFICATION_TO: "info@hausofestate.com",
};

describe("lead delivery configuration", () => {
  it("keeps Power Automate as the default and rejects an unknown provider", () => {
    expect(readLeadDeliveryProvider({})).toBe("powerautomate");
    expect(readLeadDeliveryProvider({ LEAD_DELIVERY_PROVIDER: " ZEPTOMAIL " })).toBe("zeptomail");
    expect(readLeadDeliveryProvider({ LEAD_DELIVERY_PROVIDER: " RESEND " })).toBe("resend");
    expect(() => readLeadDeliveryProvider({ LEAD_DELIVERY_PROVIDER: "other" })).toThrow("LEAD_DELIVERY_PROVIDER");
    expect(createConfiguredLeadDeliveryTransport(zeptoEnvironment)).toBeInstanceOf(ZeptoMailLeadDeliveryTransport);
    expect(createConfiguredLeadDeliveryTransport({
      POWER_AUTOMATE_FLOW_URL: "https://flow.example.test/lead",
      POWER_AUTOMATE_TENANT_ID: "tenant",
      POWER_AUTOMATE_CLIENT_ID: "client",
      POWER_AUTOMATE_CLIENT_SECRET: "secret",
    })).toBeInstanceOf(PowerAutomateLeadDeliveryTransport);
  });

  it("can use the existing Resend account for staff notifications", () => {
    expect(createConfiguredLeadDeliveryTransport({
      LEAD_DELIVERY_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_only",
      RESEND_FROM_EMAIL: "noreply@hausofestate.com",
      LEAD_NOTIFICATION_TO: "info@hausofestate.com",
    })).toBeInstanceOf(ResendLeadDeliveryTransport);
  });

  it("requires explicit ZeptoMail credentials, sender and recipient without fallback", () => {
    for (const name of ["ZEPTOMAIL_API_URL", "ZEPTOMAIL_SEND_MAIL_TOKEN", "ZEPTOMAIL_FROM_EMAIL", "LEAD_NOTIFICATION_TO"]) {
      expect(() => readZeptoMailConfig({ ...zeptoEnvironment, [name]: "" })).toThrow(name);
    }
    expect(readZeptoMailConfig(zeptoEnvironment)).toMatchObject({
      fromEmail: "noreply@hausofestate.com", toEmail: "info@hausofestate.com", timeoutMs: 8_000,
    });
  });

  it("only permits the approved regional send endpoints", () => {
    for (const region of ["com", "eu", "in"]) {
      expect(readZeptoMailConfig({ ...zeptoEnvironment, ZEPTOMAIL_API_URL: `https://api.zeptomail.${region}/v1.1/email` }).apiUrl).toContain(`.${region}/`);
    }
    for (const url of [
      "http://api.zeptomail.eu/v1.1/email", "https://api.zeptomail.eu.evil.test/v1.1/email",
      "https://api.zeptomail.eu:444/v1.1/email", "https://api.zeptomail.eu/v1.1/email?token=private",
      "https://user:password@api.zeptomail.eu/v1.1/email", "https://api.zeptomail.eu/v1.1/email#fragment",
      "https://api.zeptomail.eu/v1.1/domains", "https://127.0.0.1/v1.1/email",
    ]) expect(() => readZeptoMailConfig({ ...zeptoEnvironment, ZEPTOMAIL_API_URL: url })).toThrow("ZEPTOMAIL_API_URL");
  });

  it("rejects mailbox injection, outside recipients and invalid token headers", () => {
    for (const value of ["a@outside.test", "Name <info@hausofestate.com>", "a@hausofestate.com,b@hausofestate.com", "a@hausofestate.com\r\nBcc:outside@example.com"]) {
      expect(() => readZeptoMailConfig({ ...zeptoEnvironment, LEAD_NOTIFICATION_TO: value })).toThrow("LEAD_NOTIFICATION_TO");
      expect(() => readZeptoMailConfig({ ...zeptoEnvironment, ZEPTOMAIL_FROM_EMAIL: value })).toThrow("ZEPTOMAIL_FROM_EMAIL");
    }
    expect(() => readZeptoMailConfig({ ...zeptoEnvironment, ZEPTOMAIL_SEND_MAIL_TOKEN: "key\r\nheader: injected" })).toThrow("bare Send API key");
  });

  it("does not instantiate either provider when delivery is disabled", async () => {
    await expect(attemptImmediateLeadDelivery("event-1", { LEAD_DELIVERY_PROVIDER: "zeptomail" })).resolves.toBe("disabled");
  });

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
