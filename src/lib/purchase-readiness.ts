export type PurchaseReadinessMarket =
  | "dubai_off_plan"
  | "dubai_ready"
  | "uae"
  | "uk"
  | "bali"
  | "cyprus"
  | "international";

export interface PurchaseReadinessInput {
  city?: string;
  country?: string;
  availability?: string[] | null;
}

export interface PurchaseReadinessStep {
  title: string;
  description: string;
}

export interface PurchaseReadinessGuidance {
  market: PurchaseReadinessMarket;
  marketLabel: string;
  steps: PurchaseReadinessStep[];
  officialGuidance?: {
    label: string;
    href: string;
  };
}

const DUBAI_LAND_DEPARTMENT_FAQ =
  "https://dubailand.gov.ae/en/frequently-asked-questions";
const FCA_PAYMENT_SERVICES_GUIDANCE =
  "https://www.fca.org.uk/firms/payment-services-regulations-e-money-regulations";

function normaliseLocation(value?: string): string {
  return value?.trim().toLocaleLowerCase("en-GB") ?? "";
}

function includesAny(value: string, candidates: string[]): boolean {
  return candidates.some((candidate) => value.includes(candidate));
}

function resolveMarket({
  city,
  country,
  availability = [],
}: PurchaseReadinessInput): PurchaseReadinessMarket {
  const normalisedCity = normaliseLocation(city);
  const normalisedCountry = normaliseLocation(country);
  const availabilityValues = Array.isArray(availability) ? availability : [];
  const isOffPlan = availabilityValues.some(
    (value) => normaliseLocation(value) === "off-plan",
  );

  if (normalisedCity.includes("dubai")) {
    return isOffPlan ? "dubai_off_plan" : "dubai_ready";
  }

  if (
    includesAny(normalisedCountry, [
      "united arab emirates",
      "u.a.e",
      "uae",
      "emirates",
    ])
  ) {
    return "uae";
  }

  if (
    includesAny(normalisedCountry, ["united kingdom", "great britain", "uk"]) ||
    includesAny(normalisedCity, ["cardiff", "london", "manchester", "birmingham"])
  ) {
    return "uk";
  }

  if (
    normalisedCity.includes("bali") ||
    normalisedCountry.includes("indonesia")
  ) {
    return "bali";
  }

  if (normalisedCountry.includes("cyprus")) return "cyprus";

  return "international";
}

const FIRST_STEP: PurchaseReadinessStep = {
  title: "Verify the property and payee",
  description:
    "Confirm current availability, price, reservation terms, the seller or developer, and the named recipient account with the appointed adviser.",
};

const THIRD_STEP: PurchaseReadinessStep = {
  title: "Confirm approved instructions",
  description:
    "Treat any change in bank details as a reason to stop. Verify written instructions using independently sourced contact details before proceeding.",
};

const FIFTH_STEP: PurchaseReadinessStep = {
  title: "Keep the records and receipt",
  description:
    "Retain the signed documents, verified instructions, transfer record, and official receipt, and ask your adviser or legal professional to reconcile them.",
};

const MARKET_DETAILS: Record<
  PurchaseReadinessMarket,
  Pick<PurchaseReadinessGuidance, "marketLabel" | "officialGuidance"> & {
    legalChecks: string;
    transfer: string;
  }
> = {
  dubai_off_plan: {
    marketLabel: "Dubai off-plan purchase",
    legalChecks:
      "Have the project, developer, reservation documents, fees, and applicable registration requirements checked before committing funds.",
    transfer:
      "For an off-plan purchase, funds should go only to the project-specific escrow arrangement approved for that development after the account has been verified. Haus does not receive or forward the money.",
    officialGuidance: {
      label: "Dubai Land Department guidance",
      href: DUBAI_LAND_DEPARTMENT_FAQ,
    },
  },
  dubai_ready: {
    marketLabel: "Dubai ready-property purchase",
    legalChecks:
      "Have the ownership documents, seller authority, sale agreement, fees, and transfer requirements checked before committing funds.",
    transfer:
      "Use only the transfer route confirmed for the transaction by the appointed professionals and regulated banking providers. Haus does not receive or forward the money.",
    officialGuidance: {
      label: "Dubai Land Department guidance",
      href: DUBAI_LAND_DEPARTMENT_FAQ,
    },
  },
  uae: {
    marketLabel: "UAE property purchase",
    legalChecks:
      "Have the ownership or project documents, seller or developer authority, fees, and local transfer requirements checked before committing funds.",
    transfer:
      "Use only the account and transfer route confirmed for the transaction by the appointed professionals and regulated banking providers. Haus does not receive or forward the money.",
  },
  uk: {
    marketLabel: "UK property purchase",
    legalChecks:
      "Your independently appointed solicitor or licensed conveyancer should complete the title, identity, contract, and source-of-funds checks required for the transaction.",
    transfer:
      "Follow only the client-account and completion instructions independently confirmed with your solicitor or licensed conveyancer. Haus does not receive or forward the money.",
    officialGuidance: {
      label: "FCA payment-services guidance",
      href: FCA_PAYMENT_SERVICES_GUIDANCE,
    },
  },
  bali: {
    marketLabel: "Bali property purchase",
    legalChecks:
      "Use independently appointed Indonesian legal and notarial professionals to check title or tenure, seller authority, contracts, taxes, and the structure available to you.",
    transfer:
      "Use only the account and staged transfer instructions those independent professionals verify for the transaction. Haus does not receive or forward the money.",
  },
  cyprus: {
    marketLabel: "Cyprus property purchase",
    legalChecks:
      "Use an independently appointed Cypriot legal professional to check title, seller or developer authority, contracts, permits, taxes, and registration steps.",
    transfer:
      "Use only the account and transfer instructions independently verified for the transaction by your legal and banking providers. Haus does not receive or forward the money.",
  },
  international: {
    marketLabel: "International property purchase",
    legalChecks:
      "Appoint qualified independent legal and financial professionals in the property market to check ownership, authority, contracts, fees, and local transfer requirements.",
    transfer:
      "Use only the account and transfer route those independent professionals and regulated banking providers verify for the transaction. Haus does not receive or forward the money.",
  },
};

export function resolvePurchaseReadiness(
  input: PurchaseReadinessInput,
): PurchaseReadinessGuidance {
  const market = resolveMarket(input);
  const details = MARKET_DETAILS[market];

  return {
    market,
    marketLabel: details.marketLabel,
    officialGuidance: details.officialGuidance,
    steps: [
      FIRST_STEP,
      {
        title: "Complete adviser and legal checks",
        description: details.legalChecks,
      },
      THIRD_STEP,
      {
        title: "Use the appropriate transfer route",
        description: details.transfer,
      },
      FIFTH_STEP,
    ],
  };
}

export function isPurchaseReadinessVisible(
  enabled: boolean,
  listingTypes?: string[] | null,
): boolean {
  if (!enabled) return false;

  const isExplicitlyRentOnly =
    listingTypes?.includes("rent") && !listingTypes.includes("sale");
  return !isExplicitlyRentOnly;
}
