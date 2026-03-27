import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      intent,
      market,
      propertyTypes,
      areas,
      budget,
      timeline,
      firstName,
      whatsapp,
      phone,
      email,
    } = body;

    if (!firstName || (!whatsapp && !phone)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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

    const contactPhone = whatsapp || phone;

    console.log("Funnel lead received:", {
      intent,
      market,
      propertyTypes,
      areas,
      budget,
      timeline,
      firstName,
      contactPhone,
      email,
      score,
      tier,
      routing,
    });

    // TODO: Persist via Prisma
    // TODO: Push to CRM webhook
    // TODO: Trigger WhatsApp / email automation

    return NextResponse.json({
      success: true,
      score,
      tier,
      routing,
      market,
      message: "Lead captured successfully",
    });
  } catch (error) {
    console.error("Funnel API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
