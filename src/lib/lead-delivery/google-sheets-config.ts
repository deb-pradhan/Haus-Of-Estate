import { createPrivateKey } from "node:crypto";
import type { LeadDeliveryEnvironment } from "./config";

export interface GoogleSheetsLeadConfig {
  writesEnabled: boolean;
  spreadsheetId: string;
  tabName: string;
  clientEmail: string;
  privateKey: string;
  timeoutMs: number;
}

export function isGoogleSheetsDeliveryEnabled(environment: LeadDeliveryEnvironment = process.env): boolean {
  return environment.LEAD_SHEETS_ENABLED?.trim().toLowerCase() === "true";
}

export function readGoogleSheetsLeadConfig(environment: LeadDeliveryEnvironment = process.env): GoogleSheetsLeadConfig {
  const spreadsheetId = environment.LEAD_SHEETS_SPREADSHEET_ID?.trim() ?? "";
  const tabName = environment.LEAD_SHEETS_TAB_NAME?.trim() ?? "";
  if (!/^[A-Za-z0-9_-]{20,120}$/.test(spreadsheetId)) throw new Error("LEAD_SHEETS_SPREADSHEET_ID must be a spreadsheet ID");
  if (!tabName || tabName.length > 100 || /[\x00-\x1f]/.test(tabName)) throw new Error("LEAD_SHEETS_TAB_NAME is required");
  let credentials: { client_email?: unknown; private_key?: unknown; type?: unknown };
  try { credentials = JSON.parse(environment.LEAD_GOOGLE_SERVICE_ACCOUNT_JSON ?? ""); }
  catch { throw new Error("LEAD_GOOGLE_SERVICE_ACCOUNT_JSON must be service-account JSON"); }
  if (!credentials || credentials.type !== "service_account" ||
    typeof credentials.client_email !== "string" || !/^[^\s@]+@[^\s@]+\.iam\.gserviceaccount\.com$/.test(credentials.client_email) ||
    typeof credentials.private_key !== "string") throw new Error("LEAD_GOOGLE_SERVICE_ACCOUNT_JSON must contain service-account credentials");
  try {
    if (createPrivateKey(credentials.private_key).asymmetricKeyType !== "rsa") throw new Error();
  } catch { throw new Error("LEAD_GOOGLE_SERVICE_ACCOUNT_JSON must contain an RSA private key"); }
  const timeout = Number(environment.LEAD_DELIVERY_TIMEOUT_MS);
  return {
    writesEnabled: isGoogleSheetsDeliveryEnabled(environment), spreadsheetId, tabName,
    clientEmail: credentials.client_email, privateKey: credentials.private_key,
    timeoutMs: Number.isSafeInteger(timeout) && timeout > 0 && timeout <= 30_000 ? timeout : 8_000,
  };
}
