import { sendLeadNotificationToAdmin } from "@/lib/email/resend";
import type { NormalizedLeadIntake } from "./normalize";

export interface LegacyLeadNotification {
  score: number;
  tier: string;
}

export async function notifyLegacyLead(
  input: NormalizedLeadIntake,
  result: LegacyLeadNotification,
): Promise<void> {
  await sendLeadNotificationToAdmin({
    email: input.contact.email,
    firstName: input.contact.firstName,
    intent: input.legacy.intent ?? input.interest,
    tier: result.tier,
    score: result.score,
    phone: input.contact.phone,
  });
}
