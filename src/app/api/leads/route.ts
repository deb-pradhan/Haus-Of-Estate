import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendLeadNotificationToAdmin } from "@/lib/email/resend";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      intent,
      firstName,
      surname,
      email,
      mobile,
      consentGiven,
      buyOrRent,
      useType,
      bedrooms,
      area,
      market,
      sellOrRent,
      propertyType,
      location,
      size,
      viewType,
      urgency,
    } = body;

    // ── Validation ─────────────────────────────────────────────────────────────
    if (!firstName || !email || !mobile) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    if (!consentGiven) {
      return NextResponse.json(
        { error: "Consent required" },
        { status: 400 }
      );
    }

    // ── Lead scoring (same logic as funnel route) ───────────────────────────────
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

    // ── Upsert lead (update if exists, create if not) ─────────────────────────
    const existingLead = await db.lead.findFirst({ where: { email } });

    const leadData = {
      firstName,
      surname: surname ?? null,
      email,
      phone: mobile ?? null,
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
      score,
      tier,
      routing,
      consentGiven,
      source: "modal" as const,
    };

    const lead = existingLead
      ? await db.lead.update({
          where: { id: existingLead.id },
          data: { ...leadData, updatedAt: new Date() },
        })
      : await db.lead.create({ data: leadData });

    // ── Async admin notification (non-blocking) ────────────────────────────────
    sendLeadNotificationToAdmin({
      email,
      firstName,
      intent: intent ?? "account",
      tier,
      score,
      phone: mobile,
    }).catch((err) =>
      console.error("Failed to send lead notification:", err)
    );

    return NextResponse.json({
      success: true,
      tier,
      score,
      leadId: lead.id,
    });
  } catch (error) {
    console.error("Leads API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}