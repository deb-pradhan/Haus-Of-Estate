import "server-only";
import { isPriceAmount, isRateDateCurrent, type ExchangeRates } from "./currency";

export const EXCHANGE_RATES_URL = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=AED,GBP";

export async function fetchExchangeRates(): Promise<ExchangeRates> {
  const response = await fetch(EXCHANGE_RATES_URL, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("Exchange rates are unavailable");
  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 2) throw new Error("Invalid exchange-rate response");
  const rates: ExchangeRates["rates"] = { USD: 1, AED: 0, GBP: 0 };
  const dates: string[] = [];
  for (const row of rows) {
    if (!row || row.base !== "USD" || !["AED", "GBP"].includes(row.quote) ||
      !isPriceAmount(row.rate) || !isRateDateCurrent(row.date) || dates.length > 1 ||
      rates[row.quote as "AED" | "GBP"] !== 0) throw new Error("Invalid exchange-rate response");
    rates[row.quote as "AED" | "GBP"] = row.rate;
    dates.push(row.date);
  }
  if (!rates.AED || !rates.GBP) throw new Error("Incomplete exchange-rate response");
  return { base: "USD", rates, asOf: dates.sort()[0], fetchedAt: new Date().toISOString(), source: "Frankfurter" };
}
