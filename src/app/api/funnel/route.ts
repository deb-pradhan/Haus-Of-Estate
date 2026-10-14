import { POST as submitLead } from "@/app/api/leads/route";

export const runtime = "nodejs";

// Legacy endpoint uses the same validation, consent, rate limits and durable receipt.
export async function POST(request: Request) {
  return submitLead(request);
}
