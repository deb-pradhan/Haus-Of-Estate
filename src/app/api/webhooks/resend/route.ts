import { receiveResendWebhook } from "@/lib/email/resend-webhook";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return receiveResendWebhook(request);
}
