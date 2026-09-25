import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { GoogleSheetsLeadDeliveryTransport, GOOGLE_SHEETS_LEAD_HEADINGS } from "./google-sheets";
import { readGoogleSheetsLeadConfig, type GoogleSheetsLeadConfig } from "./google-sheets-config";
import { buildLeadDeliveryPayload } from "./payload";

const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
const config: GoogleSheetsLeadConfig = {
  writesEnabled: true, spreadsheetId: "test_spreadsheet_1234567890", tabName: "Website enquiries",
  clientEmail: "website@company.iam.gserviceaccount.com", privateKey, timeoutMs: 8000,
};
const payload = buildLeadDeliveryPayload({ eventId: "delivery-1", leadId: "lead-1", submittedAt: new Date("2026-09-25T12:00:00Z"), firstName: "=untrusted formula", email: "visitor@example.test", interest: "buy", newsletterOptIn: false, propertyMatchOptIn: false, overseasCashBuyer: false });
const token = () => Response.json({ access_token: "test-token" });
const headers = () => Response.json({ values: [GOOGLE_SHEETS_LEAD_HEADINGS] });
const lookup = (rows: string[][] = []) => Response.json({ range: "'Website enquiries'!A2:A", values: rows });
const receipt = () => Response.json({ spreadsheetId: config.spreadsheetId, updates: { updatedRows: 1, updatedColumns: 23, updatedRange: "'Website enquiries'!A2:W2" } });

describe("Google Sheets operational delivery", () => {
  it("performs no network calls unless writes are explicitly enabled", async () => {
    const fetcher = vi.fn();
    await expect(new GoogleSheetsLeadDeliveryTransport({ ...config, writesEnabled: false }, fetcher).deliver(payload)).rejects.toMatchObject({ code: "SHEETS_WRITES_DISABLED" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("uses pinned endpoints, checks the agreed headers and appends raw values", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(token()).mockResolvedValueOnce(headers()).mockResolvedValueOnce(lookup()).mockResolvedValueOnce(receipt());
    await new GoogleSheetsLeadDeliveryTransport(config, fetcher).deliver(payload);
    expect(fetcher.mock.calls[0][0]).toBe("https://oauth2.googleapis.com/token");
    const assertion = new URLSearchParams(fetcher.mock.calls[0][1].body).get("assertion")!;
    const claims = JSON.parse(Buffer.from(assertion.split(".")[1], "base64url").toString());
    expect(claims).toMatchObject({ iss: config.clientEmail, scope: "https://www.googleapis.com/auth/spreadsheets", aud: "https://oauth2.googleapis.com/token" });
    const [url, init] = fetcher.mock.calls[3];
    expect(url).toContain("valueInputOption=RAW");
    expect(init.redirect).toBe("error");
    const row = JSON.parse(init.body).values[0];
    expect(row).toHaveLength(23);
    expect(row[0]).toBe(payload.eventId);
    expect(row[3]).toBe("'=untrusted formula");
  });

  it("does not append again after an ambiguous acknowledgement if the event is already present", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(token()).mockResolvedValueOnce(headers()).mockResolvedValueOnce(lookup()).mockRejectedValueOnce(new Error("lost acknowledgement"))
      .mockResolvedValueOnce(token()).mockResolvedValueOnce(headers()).mockResolvedValueOnce(lookup([[payload.eventId]]));
    const transport = new GoogleSheetsLeadDeliveryTransport(config, fetcher);
    await expect(transport.deliver(payload)).rejects.toMatchObject({ retryable: true });
    await expect(transport.deliver(payload)).resolves.toBeUndefined();
    expect(fetcher.mock.calls.filter(([url]) => String(url).includes(":append"))).toHaveLength(1);
  });

  it("refuses mismatched headers and retries rate limits without logging response bodies", async () => {
    const mismatch = vi.fn().mockResolvedValueOnce(token()).mockResolvedValueOnce(Response.json({ values: [["Existing business sheet"]] }));
    await expect(new GoogleSheetsLeadDeliveryTransport(config, mismatch).deliver(payload)).rejects.toMatchObject({ code: "SHEETS_HEADER_MISMATCH", retryable: false });
    expect(mismatch).toHaveBeenCalledTimes(2);
    const limited = vi.fn().mockResolvedValue(new Response("sensitive response", { status: 429 }));
    await expect(new GoogleSheetsLeadDeliveryTransport(config, limited).deliver(payload)).rejects.toMatchObject({ code: "SHEETS_HTTP_429", retryable: true });
  });

  it("validates service-account credentials and stays disabled by default", () => {
    const environment = { LEAD_SHEETS_SPREADSHEET_ID: config.spreadsheetId, LEAD_SHEETS_TAB_NAME: config.tabName,
      LEAD_GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({ type: "service_account", client_email: config.clientEmail, private_key: privateKey }) };
    expect(readGoogleSheetsLeadConfig(environment).writesEnabled).toBe(false);
    expect(readGoogleSheetsLeadConfig({ ...environment, LEAD_SHEETS_ENABLED: "true" }).writesEnabled).toBe(true);
    expect(() => readGoogleSheetsLeadConfig({ ...environment, LEAD_SHEETS_SPREADSHEET_ID: "https://example.test" })).toThrow("spreadsheet ID");
    expect(() => readGoogleSheetsLeadConfig({ ...environment, LEAD_GOOGLE_SERVICE_ACCOUNT_JSON: "{}" })).toThrow("service-account credentials");
  });
});
