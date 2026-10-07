import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildLeadDeliveryPayload } from "./payload";

const mocks = vi.hoisted(() => ({ sheetsConfig: vi.fn(), sheetDeliver: vi.fn(), emailDeliver: vi.fn() }));
vi.mock("./google-sheets-config", () => ({ isGoogleSheetsDeliveryEnabled: () => true, readGoogleSheetsLeadConfig: mocks.sheetsConfig }));
vi.mock("./google-sheets", () => ({ GoogleSheetsLeadDeliveryTransport: class { deliver = mocks.sheetDeliver; } }));
vi.mock("./zeptomail", () => ({ ZeptoMailLeadDeliveryTransport: class { deliver = mocks.emailDeliver; } }));
import { createDestinationLeadDeliveryTransport } from "./runtime";

const payload = buildLeadDeliveryPayload({ eventId: "event", leadId: "lead", submittedAt: new Date(), firstName: "Test", email: "test@example.test", interest: "buy", newsletterOptIn: false, propertyMatchOptIn: false, overseasCashBuyer: false });
const context = { attempts: 1, createdAt: new Date() };

beforeEach(() => {
  mocks.sheetsConfig.mockReset().mockReturnValue({ writesEnabled: true });
  mocks.sheetDeliver.mockReset().mockResolvedValue(undefined);
  mocks.emailDeliver.mockReset().mockResolvedValue(undefined);
});

describe("independent lead destination configuration", () => {
  it("delivers Sheets even if notification credentials are absent", async () => {
    const router = createDestinationLeadDeliveryTransport({});
    await expect(router.deliver(payload, "notification", context)).rejects.toMatchObject({ code: "NOTIFICATION_CONFIG_INVALID" });
    await expect(router.deliver(payload, "google_sheets", context)).resolves.toBeUndefined();
    expect(mocks.sheetDeliver).toHaveBeenCalledWith(payload, "google_sheets", context);
  });

  it("delivers notifications even if Sheets credentials are absent", async () => {
    mocks.sheetsConfig.mockImplementation(() => { throw new Error("not configured"); });
    const router = createDestinationLeadDeliveryTransport({ LEAD_DELIVERY_PROVIDER: "zeptomail", ZEPTOMAIL_API_URL: "https://api.zeptomail.eu/v1.1/email", ZEPTOMAIL_SEND_MAIL_TOKEN: "test-key", ZEPTOMAIL_FROM_EMAIL: "noreply@hausofestate.com", LEAD_NOTIFICATION_TO: "info@hausofestate.com" });
    await expect(router.deliver(payload, "google_sheets", context)).rejects.toMatchObject({ code: "SHEETS_CONFIG_INVALID" });
    await expect(router.deliver(payload, "notification", context)).resolves.toBeUndefined();
    expect(mocks.emailDeliver).toHaveBeenCalledWith(payload, "notification", context);
  });
});
