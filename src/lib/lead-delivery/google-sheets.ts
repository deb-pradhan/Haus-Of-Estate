import { createSign } from "node:crypto";
import type { GoogleSheetsLeadConfig } from "./google-sheets-config";
import { LeadDeliveryError } from "./errors";
import { EXCEL_LEAD_TABLE_HEADINGS } from "./payload";
import type { LeadDeliveryPayload, LeadDeliveryTransport, LeadExcelRow } from "./types";

export const GOOGLE_SHEETS_LEAD_HEADINGS = ["delivery event ID", ...EXCEL_LEAD_TABLE_HEADINGS] as const;
const ROW_FIELDS: Array<keyof LeadExcelRow> = [
  "submissionTime", "leadId", "name", "email", "phone", "interest", "market", "location",
  "propertyType", "bedrooms", "bathrooms", "timeframe", "project", "propertyMatchOptIn",
  "newsletterOptIn", "overseasCashBuyer", "source", "campaign", "landingPage", "status", "owner", "notes",
];
const TOKEN_URL = "https://oauth2.googleapis.com/token";

/** Operational team sheet only. No customer messages or automatic sheet setup. */
export class GoogleSheetsLeadDeliveryTransport implements LeadDeliveryTransport {
  constructor(private readonly config: GoogleSheetsLeadConfig, private readonly fetchImplementation: typeof fetch = fetch) {}

  async deliver(payload: LeadDeliveryPayload): Promise<void> {
    // Explicit write permission is required even when the adapter is used outside the worker.
    if (!this.config.writesEnabled) throw new LeadDeliveryError("SHEETS_WRITES_DISABLED", false);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
    timer.unref?.();
    try {
      const now = Math.floor(Date.now() / 1000);
      const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
      const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({
        iss: this.config.clientEmail, scope: "https://www.googleapis.com/auth/spreadsheets",
        aud: TOKEN_URL, iat: now, exp: now + 3600,
      })}`;
      const signer = createSign("RSA-SHA256");
      signer.update(unsigned);
      const assertion = `${unsigned}.${signer.sign(this.config.privateKey, "base64url")}`;
      const tokenResponse = await this.request(TOKEN_URL, {
        method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
      }, controller.signal);
      if (typeof tokenResponse.access_token !== "string" || !tokenResponse.access_token || /\s/.test(tokenResponse.access_token)) {
        throw new LeadDeliveryError("SHEETS_INVALID_TOKEN", true);
      }
      const headers = { Authorization: `Bearer ${tokenResponse.access_token}`, "Content-Type": "application/json" };
      const sheet = `'${this.config.tabName.replace(/'/g, "''")}'`;
      const base = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/`;
      const header = await this.request(`${base}${encodeURIComponent(`${sheet}!A1:W1`)}`, { headers }, controller.signal);
      const headerRow = Array.isArray(header.values) && Array.isArray(header.values[0]) ? header.values[0] : [];
      if (headerRow.length !== GOOGLE_SHEETS_LEAD_HEADINGS.length || headerRow.some((value, index) => value !== GOOGLE_SHEETS_LEAD_HEADINGS[index])) {
        throw new LeadDeliveryError("SHEETS_HEADER_MISMATCH", false);
      }
      const existing = await this.request(`${base}${encodeURIComponent(`${sheet}!A2:A`)}`, { headers }, controller.signal);
      if (existing.values !== undefined && !Array.isArray(existing.values)) throw new LeadDeliveryError("SHEETS_INVALID_LOOKUP", true);
      if (Array.isArray(existing.values) && existing.values.some((row) => Array.isArray(row) && row[0] === payload.eventId)) return;
      const acknowledgement = await this.request(
        `${base}${encodeURIComponent(`${sheet}!A:W`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS&includeValuesInResponse=false`,
        { method: "POST", headers, body: JSON.stringify({ majorDimension: "ROWS", values: [[payload.eventId, ...ROW_FIELDS.map((field) => payload.row[field])]] }) },
        controller.signal,
      );
      const updates = acknowledgement.updates as { updatedRows?: unknown; updatedColumns?: unknown; updatedRange?: unknown } | undefined;
      if (acknowledgement.spreadsheetId !== this.config.spreadsheetId || updates?.updatedRows !== 1 ||
        updates.updatedColumns !== GOOGLE_SHEETS_LEAD_HEADINGS.length || typeof updates.updatedRange !== "string") {
        throw new LeadDeliveryError("SHEETS_INVALID_ACK", true);
      }
    } catch (error) {
      if (error instanceof LeadDeliveryError) throw error;
      throw new LeadDeliveryError(controller.signal.aborted ? "SHEETS_TIMEOUT" : "SHEETS_NETWORK", true);
    } finally {
      clearTimeout(timer);
      controller.abort();
    }
  }

  private async request(url: string, init: RequestInit, signal: AbortSignal): Promise<Record<string, unknown>> {
    const response = await this.fetchImplementation(url, { ...init, redirect: "error", signal });
    if (!response.ok) throw new LeadDeliveryError(`SHEETS_HTTP_${response.status}`, response.status === 408 || response.status === 429 || response.status >= 500);
    const value: unknown = await response.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new LeadDeliveryError("SHEETS_INVALID_ACK", true);
    return value as Record<string, unknown>;
  }
}
