import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationToAdmin } from "@/lib/email/resend";
import { parseConsent } from "@/lib/consent";

/**
 * POST /api/leads
 *
 * Consent contract (see src/lib/consent.ts):
 *   consentNotice: true      REQUIRED (legacy alias: consentGiven: true)
 *   marketingConsent?: bool  optional, defaults to false
 *   marketingChannels?: string[]
 *
 * Privacy: this route never writes personal data to logs. Every enquiry is
 * stored as a NEW record; an existing lead with the same email is never
 * overwritten, so a stranger cannot alter someone else's record.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Trim and cap an untrusted string; returns undefined when empty or not a string. */
function text(value: unknown, max = 200): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}

export async function POST(request: Request) {
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

    const intent = text(body.intent, 40);
    const firstName = text(body.firstName, 100);
    const surname = text(body.surname, 100);
    const email = text(body.email, 254)?.toLowerCase();
    const mobile = text(body.mobile, 32);
    const buyOrRent = text(body.buyOrRent, 20);
    const useType = text(body.useType, 20);
    const bedrooms = text(body.bedrooms, 10);
    const area = text(body.area, 80);
    const market = text(body.market, 20);
    const sellOrRent = text(body.sellOrRent, 20);
    const propertyType = text(body.propertyType, 40);
    const location = text(body.location, 200);
    const size = text(body.size, 20);
    const viewType = text(body.viewType, 20);
    const urgency = text(body.urgency, 20);
    const budget = text(body.budget, 60);
    const timeline = text(body.timeline, 40);
    // Email-only context (no database column for these).
    const notes = text(body.notes, 1000);
    const contactMethod = text(body.contactMethod, 20);
    const bestTime = text(body.bestTime, 20);
    const currentValue = text(body.currentValue, 40);
    const ownership = text(body.ownership, 20);
    const propertyStatus = text(body.propertyStatus, 20);
    const consentTextVersion = text(body.consentTextVersion, 20);
    const sourcePage = text(body.sourcePage, 200);

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!firstName || !email || !mobile) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const consent = parseConsent(body);
    if (!consent.notice) {
      return NextResponse.json(
        { error: "Privacy notice acknowledgement required" },
        { status: 400 },
      );
    }

    // ── Lead scoring (disclosed in the privacy policy; no automated decisions) ──
    let score = 0;
    if (intent === "buyer") score += 30;
    else if (intent === "seller") score += 25;
    else score += 10;

    if (useType === "investment") score += 15;
    if (urgency === "distress") score += 25;
    else if (urgency === "urgent") score += 15;

    const tier = score >= 60 ? "hot" : score >= 35 ? "warm" : "nurture";

    // ── Routing ────────────────────────────────────────────────────────────────
    let routing = "general";
    if (market === "dubai" && (area === "palm" || buyOrRent === "buy"))
      routing = "luxury";
    else if (intent === "invest") routing = "investment";
    else if (buyOrRent === "rent" || sellOrRent === "rent") routing = "leasing";

    // ── Persist: always append a new record, never overwrite ──────────────────
    // `consentGiven` records that the privacy notice was shown. Marketing
    // consent has no column yet; it is recorded in the notification email.
    const lead = await db.lead.create({
      data: {
        firstName,
        surname: surname ?? null,
        email,
        phone: mobile,
        intent: intent ?? "account",
        market: market ?? null,
        buyOrRent: buyOrRent ?? null,
        useType: useType ?? null,
        bedrooms: bedrooms ?? null,
        area: area ?? null,
        sellOrRent: sellOrRent ?? null,
        propertyType: propertyType ?? null,
        location: location ?? null,
        size: size ?? null,
        viewType: viewType ?? null,
        urgency: urgency ?? null,
        budget: budget ?? null,
        timeline: timeline ?? null,
        score,
        tier,
        routing,
        consentGiven: true,
        source: "modal" as const,
      },
    });

    // ── Async admin notification (non-blocking, no PII in logs) ───────────────
    sendLeadNotificationToAdmin({
      email,
      firstName,
      surname,
      intent: intent ?? "account",
      tier,
      score,
      phone: mobile,
      details: {
        Market: market,
        "Buy or rent": buyOrRent,
        "Use type": useType,
        Bedrooms: bedrooms,
        Area: area,
        "Sell or let": sellOrRent,
        "Property type": propertyType,
        Location: location,
        Size: size,
        "View type": viewType,
        Urgency: urgency,
        Budget: budget,
        Timeline: timeline,
        "Estimated value": currentValue,
        Ownership: ownership,
        "Property status": propertyStatus,
        "Preferred contact method": contactMethod,
        "Best time": bestTime,
        Notes: notes,
      },
      consent: {
        notice: consent.notice,
        marketing: consent.marketing,
        channels: consent.marketingChannels,
        textVersion: consentTextVersion,
        at: new Date().toISOString(),
        sourcePage,
      },
    }).catch((err: unknown) =>
      console.error(
        "Failed to send lead notification:",
        err instanceof Error ? err.name : "unknown error",
      ),
    );

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error(
      "Leads API error:",
      error instanceof Error ? error.name : "unknown error",
    );
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
