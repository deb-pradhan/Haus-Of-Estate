import { createRateLimiter, enforceRateLimit, isHoneypotTripped } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationToAdmin } from "@/lib/email/resend";
import { parseConsent } from "@/lib/consent";

/**
 * POST /api/funnel (the /match brief)
 *
 * Consent contract (see src/lib/consent.ts): `consentNotice: true` is required
 * (legacy alias `consentGiven: true`); `marketingConsent` is optional and
 * defaults to false. This route never logs personal data. It stores the lead
 * and emails the team; if neither succeeds it returns a non-OK status so the UI
 * never tells someone their request was received when it was not.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

function list(value: unknown, maxItems = 10): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, maxItems);
}

const limiter = createRateLimiter({ id: "funnel", limit: 5, windowMs: 10 * 60_000 });
export async function POST(request: Request) {
  {
    const limited = await enforceRateLimit(request, limiter);
    if (limited) return limited;
  }
  try {
    let body: Record<string, unknown>;
    try {
      const parsed = await request.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("not an object");
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Bots fill hidden fields; pretend success so they learn nothing.
    if (isHoneypotTripped(body.website)) return NextResponse.json({ success: true });

    const intent = text(body.intent, 20);
    const market = text(body.market, 20);
    const propertyTypes = list(body.propertyTypes);
    const areas = list(body.areas);
    const budget = text(body.budget, 60);
    const timeline = text(body.timeline, 40);
    const firstName = text(body.firstName, 100);
    const whatsapp = text(body.whatsapp, 32);
    const phone = text(body.phone, 32);
    const email = text(body.email, 254)?.toLowerCase();
    const consentTextVersion = text(body.consentTextVersion, 20);
    const sourcePage = text(body.sourcePage, 200);

    if (!firstName || (!whatsapp && !phone)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const consent = parseConsent(body);
    if (!consent.notice) {
      return NextResponse.json(
        { error: "Privacy notice acknowledgement required" },
        { status: 400 },
      );
    }

    // ── Lead Scoring ──────────────────────────────────────────────────────────
    let score = 0;

    switch (intent) {
      case "buy":  score += 30; break;
      case "invest": score += 25; break;
      case "holiday": score += 20; break;
      case "rent": score += 10; break;
    }

    // High-value budget tiers
    const premiumBudgets = [
      "aed_above_15m", "aed_7m_15m",
      "gbp_above_2m", "gbp_1m_2m",
      "usd_above_2m", "usd_1m_2m",
    ];
    const midBudgets = [
      "aed_3m_7m",
      "gbp_500k_1m",
      "usd_500k_1m",
    ];
    const volumeBudgets = [
      "aed_1m_3m", "aed_rent_10k_20k", "aed_rent_20k_50k", "aed_rent_above_50k",
      "gbp_250k_500k", "gbp_rent_2k_3k", "gbp_rent_3k_5k", "gbp_rent_above_5k",
      "usd_200k_500k", "usd_rent_2k_5k", "usd_rent_5k_10k", "usd_rent_above_10k",
    ];

    if (budget) {
      if (premiumBudgets.includes(budget)) score += 25;
      else if (midBudgets.includes(budget)) score += 15;
      else if (volumeBudgets.includes(budget)) score += 10;
      else score += 5;
    }

    if (timeline === "immediately") score += 30;
    else if (timeline === "1_3_months") score += 20;
    else if (timeline === "3_6_months") score += 10;
    else score += 5;

    if (email) score += 5;

    // ── Tier Assignment ────────────────────────────────────────────────────────
    let tier: "hot" | "warm" | "nurture";
    if (score >= 60) tier = "hot";
    else if (score >= 35) tier = "warm";
    else tier = "nurture";

    // ── Routing ───────────────────────────────────────────────────────────────
    let routing = "general";

    // Market-specific routing
    if (market === "dubai") {
      if (areas?.includes("palm") || budget === "aed_above_15m" || budget === "aed_7m_15m") {
        routing = "luxury";
      } else if (intent === "invest") {
        routing = "investment";
      } else if (intent === "rent") {
        routing = "leasing";
      }
    } else if (market === "uk") {
      if (areas?.includes("london") || budget === "gbp_above_2m" || budget === "gbp_1m_2m") {
        routing = "luxury";
      } else if (intent === "invest") {
        routing = "investment";
      } else if (intent === "rent") {
        routing = "leasing";
      }
    } else if (market === "bali") {
      if (budget === "usd_above_2m" || budget === "usd_1m_2m") {
        routing = "luxury";
      } else if (propertyTypes?.includes("land") || propertyTypes?.includes("resort")) {
        routing = "investment";
      } else if (intent === "rent") {
        routing = "leasing";
      }
    }

    const contactPhone = (whatsapp || phone) as string;

    // ── Persist (best effort) and notify the team ─────────────────────────────
    // The Lead table requires an email; the funnel makes it optional, so an
    // empty string is stored when none was given. The phone number is the
    // contact route in that case.
    let stored = false;
    try {
      await db.lead.create({
        data: {
          firstName,
          email: email ?? "",
          phone: contactPhone,
          intent: intent ?? "funnel",
          market: market ?? null,
          propertyType: propertyTypes.join(", ") || null,
          area: areas.join(", ") || null,
          budget: budget ?? null,
          timeline: timeline ?? null,
          score,
          tier,
          routing,
          consentGiven: true,
          source: "funnel",
        },
      });
      stored = true;
    } catch (err) {
      console.error(
        "Funnel lead store failed:",
        err instanceof Error ? err.name : "unknown error",
      );
    }

    const notification = await sendLeadNotificationToAdmin({
      email: email ?? "",
      firstName,
      intent: intent ?? "funnel",
      tier,
      score,
      phone: contactPhone,
      details: {
        Market: market,
        "Property types": propertyTypes.join(", "),
        Areas: areas.join(", "),
        Budget: budget,
        Timeline: timeline,
        Routing: routing,
        "Preferred contact": whatsapp ? "WhatsApp" : "Phone",
      },
      consent: {
        notice: consent.notice,
        marketing: consent.marketing,
        channels: consent.marketingChannels,
        textVersion: consentTextVersion,
        at: new Date().toISOString(),
        sourcePage: sourcePage ?? "/match",
      },
    }).catch(() => ({ delivered: false }));

    if (!stored && !notification.delivered) {
      // Neither route worked: do not claim the enquiry was received.
      return NextResponse.json(
        { error: "We could not record your request" },
        { status: 503 },
      );
    }

    return NextResponse.json({
      success: true,
      market,
      message: "Lead captured successfully",
    });
  } catch (error) {
    console.error(
      "Funnel API error:",
      error instanceof Error ? error.name : "unknown error",
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
