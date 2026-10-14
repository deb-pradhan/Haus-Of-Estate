import { fetchExchangeRates } from "@/lib/exchange-rates";

export async function GET() {
  try {
    return Response.json(await fetchExchangeRates(), {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
    });
  } catch {
    return Response.json({ error: "Exchange rates are temporarily unavailable. Original prices are shown." }, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
